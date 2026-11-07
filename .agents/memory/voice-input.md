---
name: Voice input and nutrition privacy
description: Speech-to-draft behavior, allowance decisions and upstream verification
---
Speech input creates an editable draft; the customer must send it explicitly. Do not silently auto-send recognized speech or add spoken chatbot replies.

**Why:** A recognition mistake can change a nutrition question. Reviewing the text keeps the customer in control; spoken replies were not requested.

**How to apply:** Preserve this behavior on web and Flutter, including cancellation, the thirty-second cap, microphone cleanup and a usable typing fallback.

Transcription uses one request from the existing persistent assistant allowance before contacting the paid provider.

**Why:** An additional paid endpoint must not bypass the established usage budget. Audio and transcript contents must not become usage-counter data.

**How to apply:** Keep reservations fail-closed and explain the shared allowance beside the microphone. A provider failure is not evidence that no charge occurred.

Verify actual upstream authorization rather than treating an integration's ready indicator as a successful speech test.

**Why:** A connection was reported ready while the provider returned an invalid-key response.

**How to apply:** Distinguish implemented microphone controls from verified end-to-end transcription, and report authorization blockers without exposing credentials or inventing transcripts.
