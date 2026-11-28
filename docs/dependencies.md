# Dependency maintenance

The SDK build and the Expo example use independent npm lockfiles. Update both
when a fix affects their shared Expo tooling. Keep React and React Native on
the versions selected by Expo SDK 58.

The Expo fingerprint tool uses the matching interface retained by minimatch 11. The SDK's Expo module scripts use the public glob function supported by
glob 14. Keep legacy Jest dependencies on their upstream interfaces.

Validate the locked SDK with `npm ci`, `npm run lint`, `npm run build`,
`npm run test`, and `npm run test:workflows`. Install the example separately
with `npm --prefix example ci --ignore-scripts`, then verify its Expo
fingerprint or native build. Audit each lockfile from its own directory.

[Minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) ·
[glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)
