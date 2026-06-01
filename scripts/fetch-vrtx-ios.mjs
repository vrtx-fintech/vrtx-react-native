#!/usr/bin/env node
// Downloads the VRTX iOS xcframework from the upstream release into
// ios/Frameworks/. Runs as a postinstall hook so the binary is in
// place before `pod install` runs (for both library consumers and
// local dev).
//
// Skips if the framework is already present (cached from a previous
// install or downloaded by a different mechanism), and skips entirely
// on non-Darwin platforms where the iOS build would never run anyway.

import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const VRTX_IOS_VERSION = '0.0.15';
const RELEASE_URL = `https://github.com/vrtx-fintech/vrtx-ios/releases/download/${VRTX_IOS_VERSION}/VRTX.xcframework.zip`;

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const frameworksDir = join(repoRoot, 'ios', 'Frameworks');
const targetFramework = join(frameworksDir, 'VRTX.xcframework');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (process.platform !== 'darwin') {
    console.log(
      '[vrtx-ios] Non-Darwin platform, skipping iOS framework fetch.',
    );
    return;
  }

  if (await exists(targetFramework)) {
    console.log(
      `[vrtx-ios] VRTX.xcframework ${VRTX_IOS_VERSION} already present, skipping.`,
    );
    return;
  }

  console.log(`[vrtx-ios] Downloading VRTX.xcframework ${VRTX_IOS_VERSION}...`);
  await mkdir(frameworksDir, { recursive: true });
  const tmpZip = join(tmpdir(), `vrtx-xcframework-${process.pid}.zip`);

  try {
    const res = await fetch(RELEASE_URL, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ${res.statusText} fetching ${RELEASE_URL}`,
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(tmpZip, buf);
    await execFileAsync('unzip', ['-q', tmpZip, '-d', frameworksDir]);
    console.log(
      `[vrtx-ios] Installed VRTX.xcframework ${VRTX_IOS_VERSION} to ${frameworksDir}`,
    );
  } finally {
    await rm(tmpZip, { force: true });
  }
}

main().catch((err) => {
  console.error(`[vrtx-ios] Failed to fetch VRTX.xcframework: ${err.message}`);
  process.exit(1);
});
