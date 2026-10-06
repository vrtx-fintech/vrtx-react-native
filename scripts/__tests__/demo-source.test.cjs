const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function resolveSource(overrides = {}, pr = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-source-'));
  try {
    // Mock the API boundary; execute the real resolver and GitHub output format.
    fs.writeFileSync(
      path.join(dir, 'gh'),
      '#!/bin/sh\nprintf "%s" "$TEST_PR"\n',
      { mode: 0o755 },
    );
    const output = path.join(dir, 'output');
    const result = spawnSync(
      'bash',
      [path.join(__dirname, '../resolve-demo-source.sh')],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${dir}:${process.env.PATH}`,
          GITHUB_REF: 'refs/heads/main',
          GITHUB_SHA: 'a'.repeat(40),
          GITHUB_SERVER_URL: 'https://github.com',
          GITHUB_REPOSITORY: 'vrtx-fintech/vrtx-react-native',
          GITHUB_OUTPUT: output,
          PR_NUMBER: '',
          TEST_PR: JSON.stringify(pr),
          ...overrides,
        },
      },
    );
    return {
      ...result,
      output: fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '',
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('main releases and branch previews pin the dispatched commit', () => {
  const main = resolveSource();
  assert.equal(main.status, 0);
  assert.match(main.output, /preview=false/);
  assert.match(main.output, new RegExp(`sha=${'a'.repeat(40)}`));
  const branch = resolveSource({ GITHUB_REF: 'refs/heads/demo-fix' });
  assert.equal(branch.status, 0);
  assert.match(branch.output, /preview=true/);
});

test('explicit PR preview pins the PR head instead of the dispatch ref', () => {
  const result = resolveSource(
    { PR_NUMBER: '123' },
    {
      state: 'open',
      head: {
        sha: 'b'.repeat(40),
        repo: { full_name: 'vrtx-fintech/vrtx-react-native' },
      },
      html_url: 'https://github.com/vrtx-fintech/vrtx-react-native/pull/123',
    },
  );
  assert.equal(result.status, 0);
  assert.match(result.output, new RegExp(`sha=${'b'.repeat(40)}`));
  assert.match(result.output, /preview=true/);
  assert.match(result.output, /source_url=.*\/pull\/123/);
});

test('rejects invalid PR input, closed/fork PRs, and tag dispatches', () => {
  for (const number of ['0', '-1', '123; echo bad', '1\n2']) {
    assert.notEqual(resolveSource({ PR_NUMBER: number }).status, 0);
  }
  for (const [state, repo] of [
    ['closed', 'vrtx-fintech/vrtx-react-native'],
    ['open', 'someone/fork'],
  ]) {
    const result = resolveSource(
      { PR_NUMBER: '123' },
      { state, head: { repo: { full_name: repo } } },
    );
    assert.notEqual(result.status, 0);
    assert.equal(result.output, '');
  }
  assert.notEqual(resolveSource({ GITHUB_REF: 'refs/tags/v1.0.0' }).status, 0);
});
