import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseChatInput, chatInstructions } from "@/lib/chat-policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import { ChatContextError, loadChatContext } from "@/lib/chat-context";
import { MAX_COMPLETION_TOKENS } from "@/lib/chat-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const buckets = new Map<string, { count: number; until: number }>();
const MAX_BODY = 20_000;
const json = (
  data: object,
  status = 200,
  headers: Record<string, string> = {},
) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

async function readBody(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_BODY)
    throw new Error("body-too-large");
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      throw new Error("body-too-large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization && !/^Bearer \S+$/i.test(authorization))
    return json({ error: "Invalid authorization." }, 401);
  const accessToken = authorization?.slice(7);
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    if (origin && new URL(origin).host !== host)
      return json({ error: "Request origin is not allowed." }, 403);
  } catch {
    return json({ error: "Request origin is not allowed." }, 403);
  }
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error && error.message === "body-too-large"
            ? "Message is too large."
            : "Invalid message format.",
      },
      400,
    );
  }
  const input = parseChatInput(body);
  if (!input)
    return json(
      {
        error:
          "Send 1–10 messages, up to 1500 characters each, with a language and profile preference.",
      },
      400,
    );
  const ar = input.lang === "ar";
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  for (const [k, b] of buckets) if (b.until <= now) buckets.delete(k);
  const bucket = buckets.get(key) ?? { count: 0, until: now + 60_000 };
  if (bucket.count >= 12 || buckets.size > 5000)
    return json(
      {
        error: ar
          ? "وصلت لحد الرسائل المؤقت. جرّب بعد دقيقة."
          : "Too many messages. Please try again in a minute.",
      },
      429,
    );
  bucket.count++;
  buckets.set(key, bucket);
  const apiKey = (
    process.env.GROQ_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  )?.trim();
  const baseUrl = (
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    "https://api.groq.com/openai/v1"
  )
    .trim()
    .replace(/\/+$/, "");
  const isGroq = baseUrl.includes("groq.com");
  const configuredModel = (
    process.env.AI_INTEGRATIONS_OPENAI_MODEL ||
    process.env.GROQ_MODEL ||
    ""
  ).trim();
  const groqFallbacks = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
  const modelsToTry = isGroq
    ? [
        ...(configuredModel && configuredModel !== "llama-3.3-70b-versatile"
          ? [configuredModel]
          : []),
        ...groqFallbacks,
      ].filter((m, i, arr) => arr.indexOf(m) === i)
    : [configuredModel || "gpt-5.4-mini"];

  if (!apiKey)
    return json(
      {
        error: ar
          ? "خدمة المساعد غير متاحة حاليًا."
          : "The assistant is temporarily unavailable.",
      },
      503,
    );

  try {
    const sb = !isSupabaseConfigured()
      ? null
      : accessToken
        ? createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
            {
              global: { headers: { Authorization: `Bearer ${accessToken}` } },
              auth: { persistSession: false, autoRefreshToken: false },
            },
          )
        : await supabaseServer();
    const { context } = await loadChatContext(sb, input, accessToken);
    const messages = [
      {
        role: "system" as const,
        content: chatInstructions(input.lang, context),
      },
      ...input.messages,
    ];
    const signal =
      typeof AbortSignal.any === "function"
        ? AbortSignal.any([request.signal, AbortSignal.timeout(35_000)])
        : request.signal;
    let reply: string | undefined;
    let lastErr = "";
    for (const model of modelsToTry) {
      const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_completion_tokens: MAX_COMPLETION_TOKENS,
          messages,
        }),
        signal,
      });
      if (!providerResponse.ok) {
        const errText = await providerResponse.text().catch(() => "");
        lastErr = `provider-${providerResponse.status} (${model}): ${errText.slice(0, 200)}`;
        if (providerResponse.status === 404 && isGroq) continue;
        throw new Error(lastErr);
      }
      const response = (await providerResponse.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const candidate = response.choices?.[0]?.message?.content?.trim();
      if (candidate) {
        reply = candidate;
        break;
      }
      lastErr = `empty-response (${model})`;
    }
    if (!reply) throw new Error(lastErr || "empty-response");
    return json({ reply, catalogAvailable: context.catalogAvailable });
  } catch (error) {
    if (error instanceof ChatContextError)
      return json({ error: error.message }, error.status);
    console.error(
      "[chat/route] error:",
      error instanceof Error ? error.message : String(error),
    );
    return json(
      {
        error: ar
          ? "المساعد غير متاح مؤقتًا. تعذّر التحقق من الاستخدام أو إكمال الرد؛ حاول لاحقًا."
          : "The assistant is temporarily unavailable. Usage could not be verified or the reply could not be completed; please try later.",
        code: "CHAT_UNAVAILABLE",
      },
      503,
      { "Retry-After": "60" },
    );
  }
}
