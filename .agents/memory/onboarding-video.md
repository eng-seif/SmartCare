---
name: Registration tutorial
description: User's required behavior for the pre-registration usage video.
---

Create a new usage-explanation video and show it before registration on the web and Flutter app. Watching is optional: the user chose “يمكن تخطيه,” not a mandatory watch requirement.

**Why:** The user explicitly requested a new tutorial and selected skippable viewing.

The tutorial's identity is now **Smart Care**, with a new original logo and no visible Fathalla name or logo.

**Why:** The user explicitly requested “ازاي تستخدم Smart Care” and removal of every Fathalla word and logo from the video.

**How to apply:** Keep this branding change scoped to the tutorial unless the user also asks to rebrand the web or Flutter app. Include barcode scanning in the usage explanation.

**How to apply:** Keep a clearly available skip path into registration, including when video loading or playback fails.

The skipped state should determine the web page's initial server render, rather than relying only on a post-hydration local-storage lookup.

**Why:** A browser check observed the introductory screen reappearing after reload even while the stored preference still said it had been skipped.

**How to apply:** Preserve a server-readable preference and pass it into the initial screen state; unavailable browser storage must still never prevent continuing.
