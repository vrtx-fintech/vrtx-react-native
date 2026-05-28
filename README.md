[![Android](https://github.com/vrtx-fintech/vrtx-react-native/actions/workflows/android.yml/badge.svg?branch=main)](https://github.com/vrtx-fintech/vrtx-react-native/actions/workflows/android.yml)

[![iOS](https://github.com/vrtx-fintech/vrtx-react-native/actions/workflows/ios.yml/badge.svg?branch=main)](https://github.com/vrtx-fintech/vrtx-react-native/actions/workflows/ios.yml)

# vrtx-react-native

The official React Native SDK for Vrtx — onboarding, wallet, and card flows for your app.

## Install

```bash
npm install @vrtx-fintech/vrtx-react-native
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
