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
signing certificate. Add the JitPack repository to your Android project, then
set the required manifest placeholders in the app module:

```groovy
// android/settings.gradle
dependencyResolutionManagement {
  repositories {
    google()
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

## Run the demo locally

Use the published SDK installed in `example/`; do not use `npm link`.
Install Node.js, then the native toolchain for your platform (Xcode and CocoaPods
on macOS for iOS; JDK 21 and the Android SDK for Android).

```bash
cd example
npm ci --ignore-scripts
# Set EXPO_PUBLIC_VRTX_CLIENT_ID and EXPO_PUBLIC_VRTX_CLIENT_SECRET in .env.local.
# EXPO_PUBLIC_VRTX_ENVIRONMENT defaults to SANDBOX.
npm run ios       # or: npm run android
```

Both commands regenerate only the selected native project, apply its required
configuration, build, and launch through Expo. Arguments are forwarded to Expo,
e.g. `npm run ios -- --device` or `npm run android -- --device`.
`ios:dev` and `android:dev` are aliases of the same commands. From the repository
root, `npm run ios` and `npm run android` use these commands too.

A normal `npm install` still runs prebuild for both platforms. For a platform-only
install or CI, use `npm ci --ignore-scripts` followed by the launch command above.
Do not edit the generated `example/ios` and `example/android` projects directly.
Native configuration changes need a rebuild, not just a Metro reload.

The Android helper derives the local debug certificate hash from the generated
keystore. Set `VRTX_CERT_HASH` for a different signing key; the release workflow
checks it against the injected release keystore.

To reproduce the standalone iOS CI build after installing dependencies:

```bash
cd example
npm run prebuild -- --platform ios --no-install
(cd ios && pod install)
cd ..
bash scripts/ios.sh simulator
```

The simulator ZIP is written to `example/ios/build/demo/ios-simulator.zip` and
contains the JavaScript bundle, so it does not need Metro. Simulator builds use
ad-hoc signing without a distribution certificate.
CI builds the published package pinned by the example lockfile; it does not
substitute unreleased SDK changes from the checkout.

## Release the demo

Run **Actions → App Distribution** from `main`. Select `android`, `ios`, or
`both`, a version bump, and release notes. Enable `testflight` to additionally
archive and upload the iOS app to App Store Connect.

| Platform | Preview  | Device distribution       | Downloadable artifacts                   |
| -------- | -------- | ------------------------- | ---------------------------------------- |
| Android  | Appetize | Firebase App Distribution | Release APK and preview APK              |
| iOS      | Appetize | TestFlight when requested | Simulator ZIP, signed IPA when requested |

For an on-demand PR preview, either enter the open PR number in `pr_number`
(recommended; the workflow resolves and pins its current head commit), or choose
the PR branch in the **Run workflow** branch selector. To test changes to the
workflow YAML itself, select the PR branch as the workflow ref; `pr_number` selects app source using the workflow from that ref.
PR-number runs support open PRs in this repository; fork PRs cannot use
distribution credentials.

```bash
# Build and upload Android + iOS Appetize previews for an open PR:
gh workflow run app-distribution.yml --ref main -f pr_number=123 -f platform=both
# Build downloadable artifacts only, without upload credentials:
gh workflow run app-distribution.yml --ref main -f pr_number=123 -f platform=ios -F dry_run=true
```

PR/branch previews use `0.0.<workflow run number>`, never reserve a demo tag,
and skip Firebase, TestFlight, and release announcements. Their run summary
links the selected source and exact commit to the platform outputs. To retry,
use **Re-run failed jobs** on the run page. `testflight=true` requires a main
release. `dry_run=true` works on main and PRs: it skips tags, uploads, and
announcements, and Android uses its generated debug signing key. Demo credentials
are optional for a build-only run; launching the SDK still needs them.

For main releases, both platforms share one demo version and release notes. The workflow reserves
an annotated `demo-X.Y.Z` tag before distribution so partially uploaded releases
cannot reuse a version on the next dispatch. Releases on each selected ref/PR are serialized and do not
cancel an upload already in progress. Re-run **failed jobs** to retry the same
release. Re-running all jobs reserves a new version. A final Actions summary and
one Slack announcement report each platform's outcome, including failures.
TestFlight upload success does not mean Apple has finished processing the build
or enabled it for testers.

Configure these Actions secrets at repository level or in the `sandbox`
environment:

| Used by                    | Secrets                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Both platforms             | `EXPO_PUBLIC_VRTX_CLIENT_ID`, `EXPO_PUBLIC_VRTX_CLIENT_SECRET`, `APPETIZE_API_TOKEN`                                     |
| Android signing            | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `VRTX_CERT_HASH`    |
| Android Firebase           | `FIREBASE_SERVICE_ACCOUNT_KEY`, `SANDBOX_FIREBASE_APP_ID`, `FIREBASE_TESTERS`                                            |
| Optional iOS signing       | `IOS_DISTRIBUTION_CERT_BASE64`, `IOS_DISTRIBUTION_CERT_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`, `KEYCHAIN_PASSWORD` |
| Optional TestFlight upload | `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_BASE64`                    |
| Optional announcement      | `SLACK_WEBHOOK_URL`                                                                                                      |

Use an App Store distribution profile and App Store Connect app for
`sa.vrtx.reactnative.example`. The workflow validates the profile's identity,
expiration, and distribution type, applies signing only to the app target, and
removes signing material when finished. TestFlight is off by default; requesting
it without its secrets fails before building. The simulator preview needs no
Apple distribution credentials.

Appetize uses a [zipped iOS simulator app](https://docs.appetize.io/platform/app-management/uploading-apps/ios).
The React Native demo consumes the published native SDK binaries; host app
compiler flags such as `VRTX_E2E` cannot change security checks compiled into
those binaries. A successful simulator build alone does not verify onboarding.

## Releasing the SDK

SDK npm releases are separate from demo distribution. Run **Actions → Release**
to publish a patch, minor, or major release from `main`. Update the example's
`vrtx-react-native` dependency and lockfile to the published version, then
reinstall and rebuild the demo on both platforms. `npm run release` currently
prints the CI release instructions; it does not publish locally.

## Support

For credentials, license keys, and integration help, contact your Vrtx account manager or [contact@vrtx.sa](mailto:contact@vrtx.sa).

## License

Licensed under the Apache License, Version 2.0. Copyright (C) 2026 vrtx fintech.
