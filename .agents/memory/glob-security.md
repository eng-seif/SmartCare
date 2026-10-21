---
name: Unpatched glob dependencies
description: Why the Next lint glob dependency has a temporary substitution and when to remove it.
---

Treat the Next ESLint glob substitution as temporary; remove the dependency alias and its compatibility patch together when the upstream dependency chain no longer includes vulnerable braces.

**Why:** No patched braces release was available during remediation. Replacing its parent with maintained tinyglobby removed the vulnerable parser without maintaining a private parser fork. A direct alias alone changed absolute paths to relative paths, added directory trailing slashes, and used different directory expansion defaults.

**How to apply:** On Next ESLint upgrades, check whether upstream is safe before carrying the substitution forward. If it remains necessary, verify absolute and relative paths, literal and wildcard directories, and mockup helper exclusions against the replacement.
