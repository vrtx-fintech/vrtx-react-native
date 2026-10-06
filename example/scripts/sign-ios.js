const fs = require('node:fs');
const path = require('node:path');
const xcode = require('xcode');

const { team, uuid } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const projectPath = path.resolve(
  __dirname,
  '../ios/ReactNativeSandbox.xcodeproj/project.pbxproj',
);
const project = xcode.project(projectPath);
project.parseSync();
const objects = project.hash.project.objects;
const targets = Object.values(objects.PBXNativeTarget).filter(
  (target) =>
    target.productType?.replaceAll('"', '') ===
    'com.apple.product-type.application',
);
if (targets.length !== 1)
  throw new Error('Expected exactly one iOS application target');
const configurations =
  objects.XCConfigurationList[targets[0].buildConfigurationList]
    .buildConfigurations;
for (const { value } of configurations) {
  Object.assign(objects.XCBuildConfiguration[value].buildSettings, {
    CODE_SIGN_STYLE: 'Manual',
    DEVELOPMENT_TEAM: team,
    CODE_SIGN_IDENTITY: '"Apple Distribution"',
    PROVISIONING_PROFILE_SPECIFIER: `"${uuid}"`,
  });
}
fs.writeFileSync(projectPath, project.writeSync());
