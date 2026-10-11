// expo-module-scripts' Jest preset routes .js through babel-jest and assumes the
// project supplies a Babel config (see its createJestPreset.cjs). Without one,
// React Native's Flow-typed internals — @react-native/jest-preset's setup.js
// among them — reach the parser untransformed and fail on Flow syntax.
//
// Its own babel.config.base.cjs resolves `../babel-preset-expo`, a sibling path
// that only holds inside the Expo monorepo, so the preset is declared directly.
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
