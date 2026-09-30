const { spawnSync } = require('node:child_process');
const path = require('node:path');

const [platform, ...args] = process.argv.slice(2);
if (!['ios', 'android'].includes(platform)) {
  throw new Error(
    'Usage: node scripts/run-native.js <ios|android> [Expo options]',
  );
}
if (platform === 'android') {
  const java = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', 'java')
    : 'java';
  const result = spawnSync(java, ['-version'], { encoding: 'utf8' });
  const version = `${result.stdout ?? ''}${result.stderr ?? ''}`.match(
    /version "(\d+)/,
  )?.[1];
  if (result.status !== 0 || version !== '21') {
    console.error(
      'Android demo builds require JDK 21, matching CI. Set JAVA_HOME to a JDK 21 installation and retry.',
    );
    process.exit(1);
  }
}
const cwd = path.resolve(__dirname, '..');
for (const commandArgs of [
  [
    process.execPath,
    'scripts/prebuild.js',
    '--platform',
    platform,
    '--no-install',
  ],
  ['npx', 'expo', `run:${platform}`, ...args],
]) {
  const [command, ...options] = commandArgs;
  const result = spawnSync(command, options, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
