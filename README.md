# vrtx-react-native

The official React Native SDK for Vrtx — onboarding, wallet, and card flows for your app.

## Install

The SDK is published to [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) under the `@vrtx-fintech` scope, not the public npm registry. Each consumer needs read access granted by Vrtx.

### 1. Create a GitHub personal access token

Generate a [classic personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens/creating-a-personal-access-token) with the `read:packages` scope, then ask your Vrtx account manager to grant your GitHub user read access to the `@vrtx-fintech` org's packages.

### 2. Configure the scoped registry

Add an `.npmrc` to your project root (or `~/.npmrc`):

```ini
@vrtx-fintech:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Export the token in the shell that runs `npm install`:

```bash
export NODE_AUTH_TOKEN=<your-github-pat>
```

Avoid committing the raw token. Reading it from an environment variable keeps it out of source control; CI runners can inject the same variable from a secret. See GitHub's [npm registry authentication guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) for alternatives.

### 3. Install the SDK

```bash
npm install @vrtx-fintech/vrtx-react-native
```

The SDK ships an Android library and a `postinstall` step that downloads the iOS [`VRTX.xcframework`](https://github.com/vrtx-fintech/vrtx-ios/releases) into `node_modules/@vrtx-fintech/vrtx-react-native/ios/Frameworks/`. The iOS framework release is public; only the npm package itself is gated by the GitHub Packages token above.

## Quick start

```ts
import {
  Environment,
  Language,
  Mode,
  onError,
  onSuccess,
  setup,
} from '@vrtx-fintech/vrtx-react-native';

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
| `compileSdk`          | 36      |
| Android Gradle Plugin | 8.13    |
| Kotlin                | 2.1     |
| JVM target            | 17      |

## Contract

The React Native API mirrors the Android SDK public enums:

| Parameter     | Enum          | Values                                       |
| ------------- | ------------- | -------------------------------------------- |
| `environment` | `Environment` | `Environment.Sandbox`, `Environment.Staging` |
| `language`    | `Language`    | `Language.English`, `Language.Arabic`        |
| `mode`        | `Mode`        | `Mode.LIGHT`, `Mode.DARK`                    |

`fontFamily` may be passed with the name of a font already bundled in the host app.

## Events

| Helper      | Callback payload                                     |
| ----------- | ---------------------------------------------------- |
| `onSuccess` | `() => void`                                         |
| `onError`   | `(error: { code: string; message: string }) => void` |

Both helpers return a subscription with a `remove()` method.

## Support

For credentials, license keys, and integration help, contact your Vrtx account manager or [support@vrtx.sa](mailto:support@vrtx.sa).

## License

Licensed under the Apache License, Version 2.0. Copyright (C) 2026 vrtx fintech.
