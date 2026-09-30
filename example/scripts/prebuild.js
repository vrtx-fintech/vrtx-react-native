const { spawnSync } = require('node:child_process');
const path = require('node:path');

const exampleRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const platformIndex = args.indexOf('--platform');
const platform = platformIndex >= 0 ? args[platformIndex + 1] : 'all';
if (!['ios', 'android', 'all'].includes(platform)) {
  throw new Error('--platform must be ios, android, or all');
}
function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: exampleRoot,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('npx', ['expo', 'prebuild', ...args]);
if (platform !== 'ios') {
  run('bash', ['../scripts/android.sh', '--configure-only', 'android']);
}
