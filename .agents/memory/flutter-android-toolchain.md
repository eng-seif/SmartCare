---
name: Flutter Android toolchain
description: Environment constraint for compiling native Flutter Android APKs in this workspace.
---

The absence of a Flutter language module does not mean Flutter APKs cannot be built here: Flutter and JDK are available as Nix system dependencies, but the Android SDK package is absent from the Replit package index. The official Android command-line SDK can be provisioned separately in ignored local tooling.

**Why:** The module inventory did not include Flutter, and the indexed system package for the Android SDK was unavailable, while a native Flutter build was explicitly required. Substituting a browser mockup or Expo would not meet that request.

**How to apply:** Check the build toolchain independently rather than inferring support from available language modules. Keep SDKs, caches and locally generated signing keys out of the tracked project, and verify an actual installable APK before promising one.

Native Android release compilation may exhaust this workspace's memory even though source analysis and widget tests pass. Avoid compiling Android and running the web preview or web production build concurrently.

**Why:** Android's Gradle daemon was killed by the environment's memory limit while compiling release artifacts.

**How to apply:** Constrain Gradle workers and compiler memory, then verify the emitted APK's signature and package metadata. If repeated builds fail, do not infer success solely from a file appearing on disk; report the limitation unless the final APK is independently validated.
