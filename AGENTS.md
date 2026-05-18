# Local Testing

Use the `example` app for local validation through the same package flow used by
real consumers. Do not use `npm link` for normal testing.

## After SDK changes

When changing files in `src/`, `android/`, or `ios/`:

1. From the repository root, publish a new patch release:

   ```bash
   npm run release
   ```

   This bumps the package version and publishes
   `@vrtx-fintech/vrtx-react-native` to the configured registry.

2. Update `example/package.json` so
   `@vrtx-fintech/vrtx-react-native` points to the newly released version.

3. Reinstall the example app dependencies:

   ```bash
   cd example
   npm install
   ```

4. Test the installed package through normal Expo and React Native autolinking:

   ```bash
   npm run android
   # or
   npm run ios
   ```

## Testing notes

- The example app should test the published package version, not a symlinked
  local checkout.
- `npm install` in `example/` runs `npx expo prebuild`, so native projects are
  regenerated before testing.
- Rebuild the example app after native changes; Metro reloads alone is not
  enough for Android or iOS code changes.
