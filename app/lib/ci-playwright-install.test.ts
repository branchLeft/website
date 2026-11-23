// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { ciJobBlock, ciStepBlock, readRepoFile } from './test-helpers/repo-text';

// The e2e job's Playwright install. The system dependencies (apt) and the
// browser download each run as their own step, with a step timeout and a
// bounded retry that fails closed, so a runner-network fault cannot hang the job.
const JOB = 'e2e';

const workflow = readRepoFile('.github/workflows/ci.yml');

// The shell lines of one step's `run: |` script, trimmed, blank lines dropped.
function runScript(step: string[]): string[] {
  const at = step.findIndex((line) => line.trim() === 'run: |');
  if (at === -1) throw new Error('step has no run: | script');
  return step
    .slice(at + 1)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

// A retry loop fails closed when, after its final `done`, only the `::error::`
// echo and `exit 1` remain; its only `exit 0` is the success exit inside the
// `if` that wraps the install; and it has no other exit.
function expectRetryFailsClosed(
  step: string[],
  installCommand: string,
  errorText: string,
  attemptSeconds: number
): void {
  const script = runScript(step);
  const loopOpen = script.indexOf('for attempt in 1 2 3; do');
  const loopDone = script.indexOf('done');
  expect(loopOpen).toBeGreaterThanOrEqual(0);
  expect(loopDone).toBeGreaterThan(loopOpen);

  expect(script.slice(loopDone + 1)).toEqual([`echo "::error::${errorText}"`, 'exit 1']);

  const exits = script.filter((line) => /^exit\b/.test(line));
  expect(exits).toEqual(['exit 0', 'exit 1']);

  const successExit = script.indexOf('exit 0');
  expect(successExit).toBeGreaterThan(loopOpen);
  expect(successExit).toBeLessThan(loopDone);
  expect(script[successExit - 1]).toBe(`if timeout ${attemptSeconds} ${installCommand}; then`);
}

// Unlike the attestation job reader, a missing e2e job is a failure here, not a null.
const job = ciJobBlock(workflow, JOB);
if (job === null) throw new Error(`no job named "${JOB}" in ci.yml`);
const cache = ciStepBlock(job, 'Cache Playwright browsers');
const systemDeps = ciStepBlock(job, 'Install Playwright system dependencies');
const browsers = ciStepBlock(job, 'Install Playwright browsers');

describe('ci.yml e2e Playwright install', () => {
  it('caches the Playwright browsers with a SHA-pinned actions/cache', () => {
    expect(cache.join('\n')).toMatch(/uses: actions\/cache@[0-9a-f]{40} # v\d+\.\d+\.\d+/);
    expect(cache).toContain('          path: ~/.cache/ms-playwright');
  });

  it('keys the browser cache on the locked Playwright version, with no fallback', () => {
    expect(cache).toContain(
      '          key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}'
    );
    expect(cache.some((line) => line.trim().startsWith('restore-keys'))).toBe(false);
    const versionStep = ciStepBlock(job, 'Get Playwright version');
    expect(versionStep.join('\n')).toContain("require('@playwright/test/package.json')");
    expect(versionStep).toContain('        id: playwright-version');
  });

  it('runs the apt system-dependency install before the browser download', () => {
    const names = job.filter((line) => line.trim().startsWith('- name: '));
    const index = (name: string) => names.indexOf(`      - name: ${name}`);
    expect(index('Install Playwright system dependencies')).toBeGreaterThanOrEqual(0);
    expect(index('Install Playwright system dependencies')).toBeLessThan(
      index('Install Playwright browsers')
    );
  });

  it('gives the system-dependency install a step timeout', () => {
    expect(systemDeps.some((line) => /^ {8}timeout-minutes: \d+$/.test(line))).toBe(true);
  });

  it('waits for the runner dpkg lock: writes an apt DPkg::Lock::Timeout before the retries', () => {
    const script = runScript(systemDeps);
    const config = script.findIndex((line) =>
      /^printf 'DPkg::Lock::Timeout "\d+";\\n' \| sudo tee \/etc\/apt\/apt\.conf\.d\/99dpkg-lock-timeout >\/dev\/null$/.test(
        line
      )
    );
    expect(config).toBe(0);
    expect(config).toBeLessThan(script.indexOf('for attempt in 1 2 3; do'));
  });

  it('bounds the system-dependency install worst case inside its step timeout', () => {
    // 3 attempts, each capped by timeout, plus the 15s and 30s sleeps between them.
    const attempt = Number(
      /timeout (\d+) pnpm exec playwright install-deps/.exec(runScript(systemDeps).join('\n'))?.[1]
    );
    const minutes = Number(
      systemDeps.map((line) => /^ {8}timeout-minutes: (\d+)$/.exec(line)?.[1]).find(Boolean)
    );
    expect(attempt).toBeGreaterThan(0);
    expect(3 * attempt + 15 + 30).toBeLessThanOrEqual(minutes * 60);
  });

  it('gives the browser download a step timeout', () => {
    expect(browsers.some((line) => /^ {8}timeout-minutes: \d+$/.test(line))).toBe(true);
  });

  it('system-dependency retry fails closed: its last failed attempt prints ::error:: and exits 1', () => {
    expectRetryFailsClosed(
      systemDeps,
      'pnpm exec playwright install-deps chromium webkit',
      'install-deps failed after 3 attempts',
      240
    );
  });

  it('browser retry fails closed: its last failed attempt prints ::error:: and exits 1', () => {
    expectRetryFailsClosed(
      browsers,
      'pnpm exec playwright install chromium webkit',
      'browser install failed after 3 attempts',
      120
    );
  });

  it('no longer installs apt dependencies through --with-deps', () => {
    expect(job.join('\n')).not.toContain('--with-deps');
    expect(browsers.join('\n')).not.toContain('install-deps');
  });
});
