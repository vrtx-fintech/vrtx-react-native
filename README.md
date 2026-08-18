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

freeRASP disables Android backups. Configure the host app to use the same
value to avoid a manifest-merger conflict. For Expo, add this to `app.json`:

```json
{
  "expo": {
    "android": {
      "allowBackup": false
    }
  }
}
```

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

## Support

For credentials, license keys, and integration help, contact your Vrtx account manager or [contact@vrtx.sa](mailto:contact@vrtx.sa).

## License

Licensed under the Apache License, Version 2.0. Copyright (C) 2026 vrtx fintech.
