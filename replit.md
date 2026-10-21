# Fathalla Health

The user's existing Next.js healthy-shopping app, imported from their ZIP. It rates groceries against health conditions and connects to their existing Supabase database.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- Preserve the imported Next.js and Supabase stack. **Why:** the user requested targeted changes to their project, not a rewrite or database migration.
- Do not create demo products or substitute a local database when Supabase credentials are absent. Show the connection notice instead.

## Product

- Home includes a real bilingual AI nutrition assistant in place of the live health monitor.
- Chat works with general guidance without Supabase; named product recommendations must come from the connected catalog. Health profile use requires explicit opt-in. Chat state is in-memory and is cleared when the profile-sharing choice changes.
- Product and cart results are screening guidance, not medical guarantees; missing label data triggers review instead of being treated as zero.

## User preferences

- Add dark mode and Fathalla logos/brand colours, but keep the branding subtle ("بس مش قوي").
- Remove Pantry / مؤن from category filter choices, not from the product catalog.
- The referenced three screenshots were not included with the uploaded ZIP. Do not guess which sections to remove or claim the exact popup in the screenshot is fixed until it is identified.

## Gotchas

- App workflow: `artifacts/fathalla-health: web`. App scripts are Next.js, not Vite; use its package-specific typecheck.
- Existing Supabase connection needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, securely configured. Without them the chatbot works for general guidance, but product/account/cart features cannot be verified.
- Next.js owns the chatbot endpoint at `/assistant/chat`, not `/api/assistant/chat`; `/api` belongs to the separate Express artifact.

## Chat usage protection

- Usage counters live in the existing project PostgreSQL database, separately from Supabase. Apply the Drizzle schema in development with `pnpm --filter @workspace/db run push`. The post-merge script applies this schema to development; no startup or deploy-build migrations are used. Supabase is unchanged.
- Required server settings: `DATABASE_URL` and a stable `SESSION_SECRET` of at least 32 characters, identical across instances/restarts. Never expose these in client code. Changing the secret changes personal quota identifiers, but does not reset the project budget.
- Optional positive-integer settings: `CHAT_GUEST_DAILY_LIMIT` (default 5), `CHAT_USER_DAILY_LIMIT` (20), `CHAT_PROJECT_DAILY_LIMIT` (100), `CHAT_PROJECT_DAILY_TOKEN_LIMIT` (1000000). Invalid settings disable chat instead of bypassing limits.
- Guests share one conservative allowance by default. Set `CHAT_TRUST_PROXY=true` **only after confirming the ingress overwrites `x-forwarded-for` with a trustworthy client address**; this changes guest allowances to per-IP/network. Do not enable it for a proxy that forwards arbitrary client-supplied headers. Guests on the same address share an allowance.
- Account identities come from Supabase's verified session, independently of the health-profile sharing checkbox. No health profile is read unless that checkbox is selected.
- Limits reset at midnight UTC using the database clock. Reservations count attempts, not successful replies. Failure, cancellation and retry do not refund reservations because a provider charge may already have occurred. Requests and conservatively reserved input/output tokens both count toward the project budget; token limits are not a fixed currency guarantee.
- Counter rows contain only date, HMAC-pseudonym (or project marker), attempt count and reserved-token count. No raw account IDs, IPs, messages or health data are stored. Successful reservations prune counters older than seven days; if chat is idle, pruning runs on the next accepted request.
- Storage/configuration errors return a safe 503 without calling AI. Daily exhaustion returns localized 429 with `Retry-After`, an error code and `resetAt`; clearing chat or toggling consent does not clear the allowance.
- Checks: `pnpm --filter @workspace/fathalla-health test` and `pnpm --filter @workspace/fathalla-health test:quota-db`. Integration tests require the development schema and use isolated temporary schemas and a local fake AI endpoint, not paid model calls.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
