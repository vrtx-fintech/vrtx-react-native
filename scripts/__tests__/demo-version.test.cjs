const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  nextVersion,
  previewVersion,
  applyVersion,
} = require('../demo-version.cjs');

test('bumps the newest numeric demo tag and ignores SDK/prerelease tags', () => {
  assert.deepEqual(
    nextVersion(
      ['v9.9.9', 'demo-1.0.9', 'demo-1.0.10', 'demo-2.0.0-rc.1'],
      '1.0.0',
      'patch',
    ),
    { version: '1.0.11', versionCode: 1000011 },
  );
  assert.equal(nextVersion([], '1.2.3', 'minor').version, '1.3.0');
  assert.equal(nextVersion(['demo-2.3.4'], '1.0.0', 'major').version, '3.0.0');
});
test('rejects invalid bumps and versionCode collisions', () => {
  assert.throws(() => nextVersion([], '1.0.0', 'other'));
  assert.throws(() => nextVersion([], '1.0.999', 'patch'));
  assert.throws(() => nextVersion([], '1.999.1', 'minor'));
});
test('versions both platforms and emits increasing valid Apple build numbers', () => {
  const app = () => ({
    expo: { android: { package: 'demo' }, ios: { bundleIdentifier: 'demo' } },
  });
  const first = applyVersion(app(), '1.2.3', 1002003, 9999);
  assert.equal(first.expo.version, '1.2.3');
  assert.equal(first.expo.android.versionCode, 1002003);
  assert.equal(first.expo.ios.buildNumber, '1.99.99');
  assert.equal(
    applyVersion(app(), '1.2.4', 1002004, 10000).expo.ios.buildNumber,
    '2.0.0',
  );
  assert.equal(first.expo.ios.bundleIdentifier, 'demo');
  assert.throws(() => applyVersion(app(), '1.2.3', 1002003, NaN));
});

test('PR builds use a separate monotonically increasing preview version', () => {
  assert.deepEqual(previewVersion(42), {
    version: '0.0.42',
    versionCode: 900000042,
  });
  assert.equal(
    previewVersion(43).versionCode,
    previewVersion(42).versionCode + 1,
  );
  for (const invalid of [NaN, 0, -1, 1.5, 99990000])
    assert.throws(() => previewVersion(invalid));
});
