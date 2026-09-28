# vrtx-react-native

The official React Native SDK for Vrtx — onboarding, wallet, and card flows for your app.

## Install

```bash
npm install vrtx-react-native
```

## Quick start

```ts
import {
  DesignOption,
  Environment,
  Language,
  Mode,
  onError,
  onExit,
  onSuccess,
  setup,
  type VrtxThemeOptions,
} from 'vrtx-react-native';

const successSubscription = onSuccess(() => {
  console.log('Vrtx screen opened');
});

const errorSubscription = onError((error) => {
  console.error('Vrtx error:', error.code, error.message);
});

const themeOptions: VrtxThemeOptions = {
  cardImage: 'https://example.com/card.png',
  brandLogo: 'https://example.com/logo.png',
  brandName: 'Atlas Pay',
  colors: {
    allBrands: { primary: '#377DFF', buttonLabel: '#FFFFFF' },
    labels: {
      primary: '#12233D',
      secondary: '#60708A',
      tertiary: '#8B9AB2',
      quaternary: '#B8C4D6',
    },
    fills: {
      primary: '#EAF3FF',
      secondary: '#DCEAFF',
      tertiary: '#C5D9F5',
      quaternary: '#ADC8EC',
      vibrant: { secondary: '#4DE3D1' },
    },
    backgrounds: { primary: '#F4F8FF', secondary: '#F7FAFF' },
    backgroundsGradient: { wb01: '#EAF3FF', wb02: '#E7F5F6' },
    accents: { red: '#E05252', green: '#2E9B67', greenBg: '#E1F5EA' },
  },
  spacing: { x0: 0, xxs: 2, xs: 4, sm: 8, md: 12, ml: 16, lg: 20 },
  radius: { s: 6, sm: 8, md: 12, ml: 16, lg: 20, xl: 24, full: 999, huge: 64 },
};

const exitSubscription = onExit(() => {
  console.log('Vrtx screen closed');
});

await setup({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  environment: Environment.Sandbox,
  language: Language.English,
  mode: Mode.LIGHT,
  designOption: DesignOption.OptionC,
  theme: themeOptions,
  externalReference: 'your-external-reference',
});

// Remove listeners when they are no longer needed.
successSubscription.remove();
errorSubscription.remove();
exitSubscription.remove();
```

## Native SDK versions

| Platform | SDK             | Version  |
| -------- | --------------- | -------- |
| Android  | `vrtx-android`  | `0.1.9`  |
| iOS      | `VRTX` CocoaPod | `0.1.15` |

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

| Parameter           | Enum               | Values                                                                 |
| ------------------- | ------------------ | ---------------------------------------------------------------------- |
| `environment`       | `Environment`      | `Environment.Sandbox`, `Environment.Production`                        |
| `language`          | `Language`         | `Language.English`, `Language.Arabic`                                  |
| `mode`              | `Mode`             | `Mode.LIGHT`, `Mode.DARK`                                              |
| `externalReference` | `string`           | Optional app-provided SDK session reference                            |
| `designOption`      | `DesignOption`     | `DesignOption.OptionA`, `DesignOption.OptionB`, `DesignOption.OptionC` |
| `theme`             | `VrtxThemeOptions` | Optional SDK theme and design-token overrides                          |

`fontFamily` may be passed with the name of a font already bundled in the host app.
`externalReference` may be passed as a string when your app needs to attach its own reference to the SDK session.

> **Use the exported enums, not raw strings.** The values above are sent to the
> native SDKs as plain strings. TypeScript callers are protected by the union
> types; JavaScript callers should use the exported enums as well.

## Events

| Helper      | Callback payload                                     |
| ----------- | ---------------------------------------------------- |
| `onSuccess` | `() => void`                                         |
| `onError`   | `(error: { code: string; message: string }) => void` |
| `onExit`    | `() => void`                                         |

Both helpers return a subscription with a `remove()` method.

`onExit` fires when the user closes the native SDK flow. `theme` accepts optional
brand images as URLs, color groups, spacing values, and corner-radius values;
all omitted fields retain the native SDK defaults.

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

## Support

For credentials, license keys, and integration help, contact your Vrtx account manager or [contact@vrtx.sa](mailto:contact@vrtx.sa).

## License

Licensed under the Apache License, Version 2.0. Copyright (C) 2026 vrtx fintech.
