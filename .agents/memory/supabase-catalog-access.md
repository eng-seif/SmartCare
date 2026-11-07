---
name: Supabase catalog administration
description: Public catalog reads can conceal a missing admin credential when importing products and pictures.
---
Do not infer server write access from successful public product or image reads, or infer that a storage bucket is missing from an empty privileged bucket listing.

**Why:** A publishable key saved under a server-key variable allowed public reads but returned an empty bucket list and a bucket-not-found response for an existing public bucket. A real server secret exposed the existing bucket correctly.

**How to apply:** Validate administrative access before importing or creating storage resources. Request a proper server secret securely when necessary; never weaken RLS, move Supabase data, or expose privileged credentials to the client to make imports work.
