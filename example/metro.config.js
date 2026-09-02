// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const config = getDefaultConfig(projectRoot);

// Resolve the JavaScript entry point from this checkout while keeping the
// example's installed dependencies as the first resolution source. Native
// autolinking still uses the published package in example/node_modules.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  'vrtx-react-native': workspaceRoot,
};

// Do not let Metro pick React or React Native from the workspace. Those peer
// dependencies may be installed at the workspace root and must not shadow the
// versions used by the example app.
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(path.resolve(workspaceRoot, 'node_modules', 'react')),
  new RegExp(path.resolve(workspaceRoot, 'node_modules', 'react-native')),
];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
