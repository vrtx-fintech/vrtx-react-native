#!/usr/bin/env node
// Downloads the VRTX iOS xcframework from the upstream release into
// ios/Frameworks/. Runs as a postinstall hook so the binary is in
// place before `pod install` runs (for both library consumers and
// local dev).
//
// Skips if the framework and install marker match the expected release,
// and skips entirely on non-Darwin platforms where the iOS build would
// never run anyway.

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const VRTX_IOS_VERSION = '0.0.15';
const RELEASE_URL = `https://github.com/vrtx-fintech/vrtx-ios/releases/download/${VRTX_IOS_VERSION}/VRTX.xcframework.zip`;
const RELEASE_SHA256 =
  '961b5722a4a664b29050eda493374b9d444564aa36cff6a90a0dc3735887f88f';
const FETCH_TIMEOUT_MS = 120_000;

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const frameworksDir = join(repoRoot, 'ios', 'Frameworks');
const targetFramework = join(frameworksDir, 'VRTX.xcframework');
const installMarker = join(frameworksDir, '.vrtx-ios.json');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function installedFrameworkMatches() {
  if (!(await exists(targetFramework))) {
    return false;
  }

  try {
    const marker = JSON.parse(await readFile(installMarker, 'utf8'));
    return (
      marker.version === VRTX_IOS_VERSION &&
      marker.url === RELEASE_URL &&
      marker.sha256 === RELEASE_SHA256
    );
  } catch {
    return false;
  }
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function validateZipEntries(zipPath) {
  const { stdout } = await execFileAsync('unzip', ['-Z1', zipPath], {
    maxBuffer: 1024 * 1024,
  });
  const entries = stdout.split('\n').filter(Boolean);

  if (entries.length === 0) {
    throw new Error('Downloaded archive is empty');
  }

  for (const entry of entries) {
    const parts = entry.split('/');
    const isExpectedFramework =
      entry === 'VRTX.xcframework' || entry.startsWith('VRTX.xcframework/');

    if (
      entry.startsWith('/') ||
      entry.includes('\\') ||
      parts.includes('..') ||
      !isExpectedFramework
    ) {
      throw new Error(`Unexpected archive entry: ${entry}`);
    }
  }
}

async function main() {
  if (process.platform !== 'darwin') {
    console.log(
      '[vrtx-ios] Non-Darwin platform, skipping iOS framework fetch.',
    );
    return;
  }

  if (await installedFrameworkMatches()) {
    console.log(
      `[vrtx-ios] VRTX.xcframework ${VRTX_IOS_VERSION} already present, skipping.`,
    );
    return;
  }

  if (await exists(targetFramework)) {
    console.log(
      `[vrtx-ios] Existing VRTX.xcframework is missing the ${VRTX_IOS_VERSION} install marker, replacing.`,
    );
  }

  console.log(`[vrtx-ios] Downloading VRTX.xcframework ${VRTX_IOS_VERSION}...`);
  await mkdir(frameworksDir, { recursive: true });
  const tmpZip = join(tmpdir(), `vrtx-xcframework-${process.pid}.zip`);
  const tmpExtract = join(frameworksDir, `.vrtx-ios-${process.pid}`);

  try {
    const res = await fetch(RELEASE_URL, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ${res.statusText} fetching ${RELEASE_URL}`,
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const actualSha256 = sha256(buf);

    if (actualSha256 !== RELEASE_SHA256) {
      throw new Error(
        `SHA-256 mismatch for ${RELEASE_URL}: expected ${RELEASE_SHA256}, got ${actualSha256}`,
      );
    }

    await writeFile(tmpZip, buf);
    await validateZipEntries(tmpZip);
    await rm(tmpExtract, { recursive: true, force: true });
    await execFileAsync('unzip', ['-q', tmpZip, '-d', tmpExtract]);

    const extractedFramework = join(tmpExtract, 'VRTX.xcframework');
    if (!(await exists(extractedFramework))) {
      throw new Error('Downloaded archive did not contain VRTX.xcframework');
    }

    await rm(targetFramework, { recursive: true, force: true });
    await rename(extractedFramework, targetFramework);
    await writeFile(
      installMarker,
      `${JSON.stringify(
        {
          version: VRTX_IOS_VERSION,
          url: RELEASE_URL,
          sha256: RELEASE_SHA256,
        },
        null,
        2,
      )}\n`,
    );
    console.log(
      `[vrtx-ios] Installed VRTX.xcframework ${VRTX_IOS_VERSION} to ${frameworksDir}`,
    );
  } finally {
    await rm(tmpZip, { force: true });
    await rm(tmpExtract, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`[vrtx-ios] Failed to fetch VRTX.xcframework: ${err.message}`);
  process.exit(1);
});
