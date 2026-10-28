# Fathalla Health for Android

Native Flutter companion to the Fathalla Health website. It uses the same
Supabase accounts, products, profile and basket. The assistant uses the
website's protected chat endpoint, and health profile details are never
included unless the person opts in for that conversation.

## Build an installable APK

Requires Flutter 3.32+, JDK 17 and an Android SDK with accepted licenses.

```sh
flutter pub get
flutter analyze
flutter test
flutter build apk --release --target-platform android-arm64 --dart-define=API_BASE_URL=https://YOUR_PUBLISHED_WEBSITE
```

The published website **must include the current `/mobile/config` and
`/assistant/chat` endpoints**. If the website has not been republished since
these were added, the app shows a connection error with a retry button
instead of sample products. `API_BASE_URL` is only the public published HTTPS
website URL, never a development URL. The website only serves its public
Supabase publishable/anon credential at `/mobile/config`; a service-role key
must never be placed in the mobile app.

The current Android Gradle scaffold signs locally built release APKs with an
ephemeral **debug signing key** for direct installation. This is **not**
suitable for Google Play or dependable future in-place updates. For store
distribution, configure an owner-controlled release signing key and keep
that key out of Git.

This build targets **ARM64 Android phones running Android 6.0 or newer**.

No person or health profile is seeded into the app. Health data is queried
from the existing account after sign-in and is not copied to local files.
