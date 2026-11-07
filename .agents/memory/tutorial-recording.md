---
name: Tutorial recording through the preview proxy
description: Reliable headless capture target and export constraints for the registration tutorial
---
Capture the tutorial through the shared preview proxy rather than the direct Vite port.

**Why:** In headless Chromium, the direct-port page rendered but did not emit the recording lifecycle markers. The proxied preview emitted them and produced a verified H.264/AAC MP4.

**How to apply:** Keep film changes with the video design workflow. Record/export externally, verify the actual MP4 and public byte-range delivery, and keep the durable large video in App Storage rather than Git.
