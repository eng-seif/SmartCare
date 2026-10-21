import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

export const MAX_COMPLETION_TOKENS = 8192

function positiveInt(env: NodeJS.ProcessEnv, name: string, fallback: number) {
  const value = env[name]
  if (value === undefined) return fallback
  if (!/^[1-9]\d*$/.test(value)) throw new Error('Invalid chat quota configuration')
  const n = Number(value)
  if (!Number.isSafeInteger(n) || n > 2_000_000_000) throw new Error('Invalid chat quota configuration')
  return n
}

export function quotaConfig(env: NodeJS.ProcessEnv = process.env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error('Chat quota secret missing')
  return {
    secret: env.SESSION_SECRET,
    guest: positiveInt(env, 'CHAT_GUEST_DAILY_LIMIT', 5),
    user: positiveInt(env, 'CHAT_USER_DAILY_LIMIT', 20),
    project: positiveInt(env, 'CHAT_PROJECT_DAILY_LIMIT', 100),
    tokens: positiveInt(env, 'CHAT_PROJECT_DAILY_TOKEN_LIMIT', 1_000_000),
    trustProxy: env.CHAT_TRUST_PROXY === 'true',
  }
}

export function quotaSubject(config: ReturnType<typeof quotaConfig>, headers: Headers, userId?: string) {
  // Only opt in when the ingress overwrites (not appends/passes) this header.
  // Otherwise all guests share a conservative bucket: forged headers cannot
  // create fresh allowances. Cookies, chat clearing and consent do not affect it.
  const ip = config.trustProxy ? headers.get('x-forwarded-for')?.split(',')[0]?.trim() : undefined
  const identity = userId ?? (ip && isIP(ip) ? ip : 'shared-guests')
  const kind = userId ? 'user' : 'guest'
  return `${kind}:${createHmac('sha256', config.secret).update(`${kind}:${identity}`).digest('hex')}`
}

export function reservedTokens(messages: { role: string; content: string }[]) {
  // Reserve conservatively, including output/reasoning allowance and framing.
  // UTF-8 bytes bound the model's byte-based tokenizer; no prompts are stored.
  return Buffer.byteLength(JSON.stringify(messages), 'utf8') + 1024 + MAX_COMPLETION_TOKENS
}

export function limitMessage(lang: 'en' | 'ar', scope: 'personal' | 'project') {
  if (scope === 'project') return lang === 'ar'
    ? 'وصل المساعد لسقف الاستخدام اليومي للمشروع. جرّب بعد منتصف الليل بتوقيت UTC.'
    : 'The assistant has reached its daily project budget. Try again after midnight UTC.'
  return lang === 'ar'
    ? 'وصلت لحد رسائل الشات اليومي. جرّب بعد منتصف الليل بتوقيت UTC.'
    : 'You have reached your daily chat allowance. Try again after midnight UTC.'
}
