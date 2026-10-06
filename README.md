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

## Run the demo

Install Node.js and the native toolchain: Xcode/CocoaPods for iOS, or JDK 21
and the Android SDK for Android. Use the published dependency in `example/`;
do not use `npm link`.

```bash
cd example
npm ci --ignore-scripts
# Configure EXPO_PUBLIC_VRTX_CLIENT_ID and EXPO_PUBLIC_VRTX_CLIENT_SECRET in .env.local.
# EXPO_PUBLIC_VRTX_ENVIRONMENT defaults to SANDBOX.
npm run ios       # or: npm run android
```

Both commands prebuild the selected platform, apply its configuration, build,
and launch. Forward Expo options with `--`, e.g. `npm run ios -- --device`.
The root `npm run ios` / `npm run android` commands and example `ios:dev` /
`android:dev` aliases use the same path. A normal `npm install` still prebuilds
both platforms; rebuild after native changes. Generated native projects are
ignored by Git.

To reproduce the standalone iOS CI artifact:

```bash
cd example
npm run prebuild -- --platform ios --no-install
(cd ios && pod install)
cd ..
bash scripts/ios.sh
```

This creates `example/ios/build/demo/ios-simulator.zip` with bundled JavaScript
and ad-hoc simulator signing. Native CI builds the published SDK version in the
example lockfile; it does not substitute unpublished SDK source changes.

## Demo workflows

**Actions → App Distribution** supports Android, iOS, or both. Use an open
same-repository PR number, or select its branch, for an on-demand preview:

```bash
gh workflow run app-distribution.yml --ref main -f pr_number=123 -f platform=both
# Build downloadable artifacts without uploading previews:
gh workflow run app-distribution.yml --ref main -f pr_number=123 -F dry_run=true
```

To test workflow YAML changes, select the PR branch as `--ref`. `pr_number`
selects app source, and each build pins the resolved commit. PR previews use
`0.0.<run number>`, debug signing, and Appetize; they do not reserve release tags
or send release announcements. Public PR builds receive no distribution secrets.
Appetize uploads run separately and never execute PR code or artifact contents.

**Public repository:** every downloadable demo and Appetize preview may be
inspected. Set the Actions **variables** `PUBLIC_DEMO_CLIENT_ID` and
`PUBLIC_DEMO_CLIENT_SECRET` to dedicated sandbox credentials approved for public
sharing. These values are intentionally embedded in the app. Never put private
client credentials in these variables. CI ignores dotenv files; local demos
still support `.env.local`. Build-only runs work without the variables but cannot
open an authenticated SDK session.

Main releases reserve `demo-X.Y.Z` tags before uploading, distribute Android to
Firebase, and optionally upload iOS to TestFlight (`testflight=true`). Failed-job
reruns retain the version; rerunning all jobs reserves a new one. `dry_run`
skips tags, uploads, and announcements. A shared run summary links the source,
artifacts, and previews. Artifacts expire after seven days. TestFlight upload
success is separate from Apple processing and tester availability.

Configure distribution secrets at repository level or in `sandbox`:

| Purpose                     | Secrets                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Appetize                    | `APPETIZE_API_TOKEN`                                                                                                     |
| Android signing             | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `VRTX_CERT_HASH`    |
| Firebase                    | `FIREBASE_SERVICE_ACCOUNT_KEY`, `SANDBOX_FIREBASE_APP_ID`, `FIREBASE_TESTERS`                                            |
| Optional iOS signing        | `IOS_DISTRIBUTION_CERT_BASE64`, `IOS_DISTRIBUTION_CERT_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`, `KEYCHAIN_PASSWORD` |
| Optional TestFlight         | `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_BASE64`                    |
| Optional Slack announcement | `SLACK_WEBHOOK_URL`                                                                                                      |

TestFlight needs an App Store profile and app for `sa.vrtx.reactnative.example`.
The workflow checks the profile, signs only the app target, and cleans up signing
material. Simulator previews need no Apple distribution credentials. Host flags
such as `VRTX_E2E` do not change checks inside the published native SDK binary;
a successful simulator build does not verify onboarding.

## Releasing the SDK

Use **Actions → Release** to publish from `main`, then update the example
dependency and lockfile and rebuild both platforms. `npm run release` currently
prints these CI instructions; it does not publish locally.

## Support

For credentials, license keys, and integration help, contact your Vrtx account manager or [contact@vrtx.sa](mailto:contact@vrtx.sa).

## License

Licensed under the Apache License, Version 2.0. Copyright (C) 2026 vrtx fintech.

## Code scanning

The checked-in CodeQL workflow scans GitHub Actions and JavaScript/TypeScript
on every pull request to `main`, including dependency updates, every push to
`main`, and weekly. It publishes the `Analyze (actions)` and
`Analyze (javascript-typescript)` checks required by branch protection. No
package credentials or application build are required for these languages.

Use GitHub’s [advanced setup procedure](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configuring-advanced-setup-for-code-scanning)
when switching from default setup so one configuration owns these analyses.
The explicit pull-request trigger addresses dependency PRs whose default
setup analyses were never scheduled. Required security checks stay enabled.

## Development runtime compatibility

The Expo SDK 57 development and example toolchain uses React Native 0.86
and React 19.2. Update React Native, React and their types together with a
supported stable Expo SDK upgrade; do not adopt a newer runtime line ahead
of that SDK. Dependabot holds these incompatible lines while continuing
compatible package and patch updates. See the [official Expo compatibility
table](https://docs.expo.dev/versions/latest/).

## Dependency maintenance

Dependabot updates the root and example npm manifests, Android Gradle
dependencies and GitHub Actions. The iOS bridge uses a CocoaPods podspec,
not a Swift Package Manager manifest. It has no `Package.swift`, so a Swift
Dependabot updater cannot resolve dependencies in `ios/`. Review the native
`VRTX` pod pin when adopting a published iOS SDK release and validate it
through the normal iOS example build. See the [official supported ecosystems
and manifests](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories).
