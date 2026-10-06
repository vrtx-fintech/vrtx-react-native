const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

function nextVersion(tags, seed, bump) {
  const parse = (value) => {
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
      throw new Error(`Invalid demo version: ${value}`);
    }
    return value.split('.').map(Number);
  };
  const versions = [
    parse(seed),
    ...tags
      .filter((tag) => /^demo-\d+\.\d+\.\d+$/.test(tag))
      .map((tag) => parse(tag.slice(5))),
  ];
  versions.sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2]);
  let [major, minor, patch] = versions[0];
  switch (bump) {
    case 'patch':
      patch++;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    default:
      throw new Error(`Unsupported bump: ${bump}`);
  }
  const versionCode = major * 1000000 + minor * 1000 + patch;
  if (
    minor > 999 ||
    patch > 999 ||
    !Number.isSafeInteger(versionCode) ||
    versionCode > 2100000000
  ) {
    throw new Error(
      'Demo version exceeds the Android versionCode encoding; use a larger version bump',
    );
  }
  return { version: `${major}.${minor}.${patch}`, versionCode };
}

function previewVersion(runNumber) {
  if (
    !Number.isSafeInteger(runNumber) ||
    runNumber < 1 ||
    runNumber >= 99990000
  ) {
    throw new Error('A positive CI run number below 99990000 is required');
  }
  return { version: `0.0.${runNumber}`, versionCode: 900000000 + runNumber };
}

function applyVersion(app, version, versionCode, runNumber) {
  if (
    !Number.isSafeInteger(runNumber) ||
    runNumber < 1 ||
    runNumber >= 99990000
  ) {
    throw new Error('A positive CI run number below 99990000 is required');
  }
  app.expo.version = version;
  app.expo.android.versionCode = versionCode;
  // CFBundleVersion allows up to four digits, then two, then two.
  app.expo.ios.buildNumber = `${Math.floor(runNumber / 10000) + 1}.${Math.floor(runNumber / 100) % 100}.${runNumber % 100}`;
  return app;
}

if (require.main === module) {
  const appPath = 'example/app.json';
  const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
  if (process.argv[2] === 'apply') {
    const updated = applyVersion(
      app,
      process.env.VERSION,
      Number(process.env.VERSION_CODE),
      Number(process.env.GITHUB_RUN_NUMBER),
    );
    fs.writeFileSync(appPath, `${JSON.stringify(updated, null, 2)}\n`);
  } else {
    const tags = execFileSync('git', ['tag', '--list', 'demo-*'], {
      encoding: 'utf8',
    })
      .trim()
      .split('\n');
    const { version, versionCode } =
      process.env.PREVIEW === 'true'
        ? previewVersion(Number(process.env.GITHUB_RUN_NUMBER))
        : nextVersion(tags, app.expo.version, process.env.BUMP);
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${version}\nversion_code=${versionCode}\n`,
    );
  }
}
module.exports = { nextVersion, previewVersion, applyVersion };
