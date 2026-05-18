# Local Testing

Use the `example` app for local smoke tests. It normally installs the published
`@vrtx-fintech/vrtx-react-native` package, so use a temporary local link when you
need to test unpublished changes.

## Test the local package through autolinking

From the repository root:

```bash
npm install
npm run build
```

Then link the local package into the example app without changing
`example/package.json`:

```bash
cd example
npm link ../
```

React Native and Expo will discover the linked package through normal
autolinking because it appears at
`example/node_modules/@vrtx-fintech/vrtx-react-native`.

After linking, regenerate native projects before testing native changes:

```bash
npx expo prebuild --clean
npm run android
# or
npm run ios
```

## While iterating

- Re-run `npm run build` from the repository root after changing TypeScript
  sources, because the package entry point is `build/index.js`.
- Re-run `npx expo prebuild --clean` from `example` after changing native module
  registration, Expo module config, Gradle files, Podspecs, or iOS files.
- Rebuild the example app after native changes; Metro reloads alone is not
  enough for Android or iOS code changes.

## Return to the published package

When the local test is finished:

```bash
cd example
npm unlink @vrtx-fintech/vrtx-react-native
npm install
```

That restores the published dependency declared in `example/package.json`.
