---
name: Chat counter storage authorization
description: Scope of the user's authorization to use project PostgreSQL alongside Supabase.
---

The user explicitly approved using the existing project PostgreSQL database for chat usage counters only. This does not authorize moving existing Supabase data or storing conversations or health information.

**Why:** The user agreed to a separate, counters-only store to protect AI credit across restarts and multiple instances, without changing their existing application's database.

**How to apply:** Keep quota persistence separate from Supabase business/profile data. Ask before expanding this storage permission to other purposes.
