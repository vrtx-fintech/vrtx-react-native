// This package is a React Native SDK module, not a runnable Expo app.
// Any `expo` CLI command (start / prebuild / run:ios / run:android)
// loads this file via @expo/config and will fail loudly instead of
// silently generating a stray Expo app on top of the SDK's ios/ tree.
//
// The runnable example lives in ./example — go there to develop or
// smoke-test the SDK:
//
//   cd example
//   npx expo run:ios
//
module.exports = () => {
  throw new Error(
    [
      '',
      'vrtx-react-native is a library, not a runnable Expo app.',
      'Run Expo commands from the ./example directory instead:',
      '',
      '  cd example',
      '  npx expo run:ios       # iOS simulator',
      '  npx expo run:android   # Android emulator',
      '  npx expo start         # JS-only dev server',
      '',
    ].join('\n'),
  );
};
