# Development

`README.md` is for SDK consumers and ships to npm. Update it only for SDK
changes (install, setup, API, events, platform integration), never for
development, demo, CI, or release notes.

## Testing SDK changes

Test through the `example` app using the published package. Never use
`npm link`.

After changing `src/`, `android/`, or `ios/`:

1. Publish a patch release from `main` via **Actions → Release**
   (`npm run release` only prints these instructions).
2. Set `vrtx-react-native` in `example/package.json` (and lockfile) to the new
   version.
3. Install and run:

   ```bash
   cd example
   npm install
   npm run android   # or: npm run ios
   ```

Notes:

- `npm install` in `example/` runs `npx expo prebuild`; generated native
  projects are Git-ignored.
- Rebuild after native changes; a Metro reload is not enough.

## Running the demo

Needs Node.js, plus Xcode/CocoaPods (iOS) or JDK 21 and the Android SDK
(Android). Set `EXPO_PUBLIC_VRTX_CLIENT_ID` and `EXPO_PUBLIC_VRTX_CLIENT_SECRET`
in `example/.env.local` (`EXPO_PUBLIC_VRTX_ENVIRONMENT` defaults to `SANDBOX`).

```bash
cd example
npm ci --ignore-scripts
npm run ios       # or: npm run android
```

## Local development and Metro

- `npm run ios` / `npm run android` in `example/` prebuild, build, and launch the
  app. They also start Metro, which serves the example's JavaScript.
- To run Metro alone (e.g. with an already-installed dev build), use
  `npm start` in `example/`. Press `r` to reload.
- Metro resolves `vrtx-react-native` from `example/node_modules` (the published
  package), not from `src/`. Editing `src/` has no effect in the example until
  you release and reinstall; edit `example/App.tsx` for fast JS-only iteration.
- JS changes in the example hot-reload through Metro. Native changes (`android/`,
  `ios/`, config plugins, `app.json`) require a rebuild.
- If Metro serves stale code, restart it with `npm start -- --clear`.

## Constraints

- Keep React Native, React, and their types aligned with the example's Expo SDK
  (57: RN 0.86, React 19.2); upgrade them together with a stable Expo SDK.
- The iOS bridge uses a podspec. When adopting a new iOS SDK release, update the
  `VRTX` pod pin and verify with the iOS example build.
