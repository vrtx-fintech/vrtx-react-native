# vrtx-react-native

The official React Native SDK for Vrtx — onboarding, wallet, and card flows for your app.

## Install

```bash
npm install vrtx-react-native
```

## Quick start

```ts
import {
  Environment,
  Language,
  Mode,
  onError,
  onSuccess,
  setup,
} from 'vrtx-react-native';

const successSubscription = onSuccess(() => {
  console.log('Vrtx screen opened');
});

const errorSubscription = onError((error) => {
  console.error('Vrtx error:', error.code, error.message);
});

await setup({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  environment: Environment.Sandbox,
  language: Language.English,
  mode: Mode.LIGHT,
  externalReference: 'your-external-reference',
});

// Remove listeners when they are no longer needed.
successSubscription.remove();
errorSubscription.remove();
```

## Requirements

### iOS

| Requirement | Version |
| ----------- | ------- |
| iOS         | 15.6+   |
| Xcode       | 16+     |
| Swift       | 5.9+    |

### Android

| Requirement           | Version |
| --------------------- | ------- |
| `minSdk`              | 29      |
| `compileSdk`          | 37      |
| Android Gradle Plugin | 8.13    |
| Kotlin                | 2.1.x   |
| JVM target            | 17      |

## Contract

The React Native API mirrors the Android SDK public enums:

| Parameter           | Enum          | Values                                          |
| ------------------- | ------------- | ----------------------------------------------- |
| `environment`       | `Environment` | `Environment.Sandbox`, `Environment.Production` |
| `language`          | `Language`    | `Language.English`, `Language.Arabic`           |
| `mode`              | `Mode`        | `Mode.LIGHT`, `Mode.DARK`                       |
| `externalReference` | `string`      | Optional app-provided SDK session reference     |

`fontFamily` may be passed with the name of a font already bundled in the host app.
`externalReference` may be passed as a string when your app needs to attach its own reference to the SDK session.

> **Use the exported enums, not raw strings.** The values above are sent to the
> native SDKs as plain strings, and both bridges fall back to a default rather
> than raising on a value they do not recognise: an unknown `environment`
> silently runs against **sandbox**, an unknown `language` against English, an
> unknown `mode` against light. TypeScript callers are protected by the union
> types; JavaScript callers are not. `npm test` enforces that every exported
> enum value is one the native bridges actually match.

## Testing

```bash
npm test
```

The suite is a contract check between the JavaScript enums and the native
bridges. Nothing in the type system connects `Environment.Production` to the
`"PRODUCTION"` string that `VrtxSdkModule.swift` and `VrtxSdkModule.kt` compare
against, and — because the iOS job's only Swift compilation is gated behind
signing secrets — nothing in CI compiles those files either. The tests read the
native sources directly and fail if an enum value, a public union type, or this
README drifts from what the bridges accept. They need no simulator, emulator or
signing, so they run on every pull request.

## Events

| Helper      | Callback payload                                     |
| ----------- | ---------------------------------------------------- |
| `onSuccess` | `() => void`                                         |
| `onError`   | `(error: { code: string; message: string }) => void` |

Both helpers return a subscription with a `remove()` method.

## Android app integrity (freeRASP)

`vrtx-android` uses Talsec freeRASP to verify the host app's package name and
signing certificate. Add the freeRASP and JitPack repositories to your Android
project, then set the required manifest placeholders in the app module:

```groovy
// android/settings.gradle
dependencyResolutionManagement {
  repositories {
    google()
    maven { url 'https://europe-west3-maven.pkg.dev/talsec-artifact-repository/freerasp' }
    maven { url 'https://jitpack.io' }
    mavenCentral()
  }
}
```

```groovy
// android/app/build.gradle
android {
  defaultConfig {
    manifestPlaceholders.vrtxPackageName = applicationId
    manifestPlaceholders.vrtxCertHash = 'YOUR_BASE64_SHA256_CERTIFICATE_HASH'
  }
}
```

Generate the hash from the certificate that signs the installed app (debug and
release hashes may be comma-separated):

```bash
keytool -list -v -keystore path/to/your/keystore.jks -alias your_alias
echo -n "SHA256_HEX_WITHOUT_COLONS" | xxd -r -p | base64
```

Run a native rebuild after changing the hash; a Metro reload is not enough.

freeRASP disables Android backups and enforces certain network/security settings.
To avoid manifest-merger conflicts, configure the host app with the same values
that the SDK expects. For Expo, add these to `app.json`:

```json
{
  "expo": {
    "android": {
      "allowBackup": false,
      "usesCleartextTraffic": false
    }
  }
}
```

If you are using a native Android app rather than Expo, set the equivalent values
in `AndroidManifest.xml`:

```xml
<application
  android:allowBackup="false"
  android:usesCleartextTraffic="false" />
```

This prevents conflicts with the `vrtx-android` freeRASP manifest configuration.

### Android CI secrets

For a release build in GitHub Actions, store the signing material as repository
secrets. Never commit a keystore or its passwords.

| Secret                      | Value                                             |
| --------------------------- | ------------------------------------------------- |
| `VRTX_CERT_HASH`            | Base64 SHA-256 hash used for `vrtxCertHash` above |
| `ANDROID_KEYSTORE_BASE64`   | Base64-encoded release `.jks`/`.p12` keystore     |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password                                 |
| `ANDROID_KEY_ALIAS`         | Release key alias                                 |
| `ANDROID_KEY_PASSWORD`      | Release key password                              |

Decode `ANDROID_KEYSTORE_BASE64` in CI, configure the Android `release`
`signingConfig` with the remaining secrets, and build `assembleRelease`. The
certificate used by that signing configuration must be the one used to derive
`VRTX_CERT_HASH`.

## iOS TestFlight distribution

No FreeRASP certificate hash or additional VRTX secret is required for iOS.
The freeRASP runtime ships inside the `VRTX` pod itself, so `pod install` is
the only step — there is nothing to add to your `Podfile` and no Talsec
repository to configure, unlike Android.

For a TestFlight build, consumers should:

1. Register the final bundle identifier in Apple Developer and configure a
   distribution certificate and provisioning profile (or Xcode automatic
   signing).
2. Run `pod install` after installing `vrtx-react-native`; the module pins the
   `VRTX` CocoaPod automatically.
3. Archive the app with the `Release` configuration, upload it to App Store
   Connect, and test the installed TestFlight build using the same client
   credentials and environment supplied to `setup`.

Use the final bundle identifier before issuing production credentials. Contact
Vrtx support if the identifier or signing setup changes after onboarding.

## Releasing

Releases are published by CI only:

**Actions → Release → Run workflow**, choosing `patch`, `minor` or `major`.

The workflow bumps the version, runs lint, format and build, publishes with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements), tags
the commit and creates the GitHub release. Publishing from a workstation skips
every one of those steps and produces a package with no provenance attestation —
`0.1.86` and `0.1.87` were both published that way, and both shipped pinning a
`VRTX` version that could not be installed while `main` was correct.

After the release lands, point the example at it so CI exercises the real
published artifact:

```bash
cd example && npm pkg set dependencies.vrtx-react-native="^<new version>" && npm install
```

## Support

For credentials, license keys, and integration help, contact your Vrtx account manager or [contact@vrtx.sa](mailto:contact@vrtx.sa).

## License

Licensed under the Apache License, Version 2.0. Copyright (C) 2026 vrtx fintech.
