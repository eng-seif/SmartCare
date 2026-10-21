import type { Pool } from "pg";

export type QuotaReservation = {
  subject: string;
  personalLimit: number;
  projectLimit: number;
  projectTokenLimit: number;
  tokens: number;
};
export type QuotaResult = {
  allowed: boolean;
  scope: "personal" | "project";
  resetAt: string;
};

// The project row is locked first in every transaction, serializing reservations
// across instances. Both counters commit together, or neither does.
export async function reserveChatUsage(pool: Pool, input: QuotaReservation): Promise<QuotaResult> {
  if (!/^(guest|user):[a-f0-9]{64}$/.test(input.subject) ||
      ![input.personalLimit, input.projectLimit, input.projectTokenLimit, input.tokens]
        .every(n => Number.isSafeInteger(n) && n > 0 && n <= 2_000_000_000)) {
    throw new Error("Invalid quota reservation");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query("SET LOCAL lock_timeout = '4s'");
    // Use the database clock, not individual instance clocks; UTC rollover.
    const { rows: [clock] } = await client.query<{ day: string; reset: string }>(`
      SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date::text AS day,
        (((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date + 1)::timestamp
          AT TIME ZONE 'UTC')::text AS reset
    `);
    const resetAt = new Date(clock!.reset).toISOString();
    await client.query(`
      INSERT INTO chat_usage (day, subject) VALUES ($1, 'project')
      ON CONFLICT DO NOTHING
    `, [clock!.day]);
    const { rows: [project] } = await client.query<{ requests: number; reserved_tokens: number }>(
      "SELECT requests, reserved_tokens FROM chat_usage WHERE day = $1 AND subject = 'project' FOR UPDATE",
      [clock!.day],
    );
    if (project!.requests >= input.projectLimit ||
        project!.reserved_tokens + input.tokens > input.projectTokenLimit) {
      await client.query("ROLLBACK");
      return { allowed: false, scope: "project", resetAt };
    }
    await client.query(`
      INSERT INTO chat_usage (day, subject) VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [clock!.day, input.subject]);
    const { rows: [personal] } = await client.query<{ requests: number }>(
      "SELECT requests FROM chat_usage WHERE day = $1 AND subject = $2 FOR UPDATE",
      [clock!.day, input.subject],
    );
    if (personal!.requests >= input.personalLimit) {
      await client.query("ROLLBACK");
      return { allowed: false, scope: "personal", resetAt };
    }
    await client.query(`
      UPDATE chat_usage SET requests = requests + 1, reserved_tokens = reserved_tokens + $3
      WHERE day = $1 AND subject IN ('project', $2)
    `, [clock!.day, input.subject, input.tokens]);
    // Short retention; the project lock makes concurrent cleanup safe.
    await client.query("DELETE FROM chat_usage WHERE day < $1::date - 7", [clock!.day]);
    await client.query("COMMIT");
    return { allowed: true, scope: "personal", resetAt };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
