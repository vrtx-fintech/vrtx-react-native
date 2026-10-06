const { spawnSync } = require('node:child_process');
const path = require('node:path');

const [action, ...args] = process.argv.slice(2);
if (!['prebuild', 'ios', 'android'].includes(action)) {
  throw new Error(
    'Usage: node scripts/native.js <prebuild|ios|android> [Expo options]',
  );
}
const cwd = path.resolve(__dirname, '..');
function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (action === 'android') {
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
const prebuildArgs =
  action === 'prebuild' ? args : ['--platform', action, '--no-install'];
const platformIndex = prebuildArgs.indexOf('--platform');
const platform = platformIndex >= 0 ? prebuildArgs[platformIndex + 1] : 'all';
if (!['ios', 'android', 'all'].includes(platform)) {
  throw new Error('--platform must be ios, android, or all');
}
run('npx', ['expo', 'prebuild', ...prebuildArgs]);
if (platform !== 'ios')
  run('bash', ['../scripts/android.sh', '--configure-only', 'android']);
if (action !== 'prebuild') run('npx', ['expo', `run:${action}`, ...args]);
