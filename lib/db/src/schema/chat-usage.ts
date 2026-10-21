import { check, date, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Counters only: never persist IPs, account IDs, prompts, replies or health data.
export const chatUsage = pgTable("chat_usage", {
  day: date("day").notNull(),
  subject: text("subject").notNull(),
  requests: integer("requests").notNull().default(0),
  reservedTokens: integer("reserved_tokens").notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.day, t.subject] }),
  check("chat_usage_nonnegative", sql`${t.requests} >= 0 AND ${t.reservedTokens} >= 0`),
]);
