---
name: Preview hydration constraints
description: Root bootstrap scripts must tolerate Replit's preview-injected head scripts.
---

Root bootstrap changes must be checked through the Replit preview proxy, including the browser console.

**Why:** The preview injects additional scripts into the document head. A direct HTTP 200 and a passing typecheck did not reveal a React hydration mismatch involving early Next.js scripts.

**How to apply:** Preserve pre-paint theme initialization, but avoid introducing head bootstrap elements without checking a proxied browser load. Do not conceal structural mismatches with broad hydration-warning suppression.
