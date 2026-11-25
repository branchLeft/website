// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { ciJobBlock, ciStepBlock, readRepoFile } from './test-helpers/repo-text';

// The Playwright install lives in the shared composite that ci.yml's checks and
// e2e jobs call. Only the e2e job turns it on. Its system dependencies (apt) and
// the browser download each run as their own step, with a bounded retry that
// fails closed, so a runner-network fault cannot hang the job.
const ACTION_PATH = '.github/actions/setup-pnpm-node/action.yml';
const COMPOSITE = '.github/actions/setup-pnpm-node';

const workflow = readRepoFile('.github/workflows/ci.yml');
const action = readRepoFile(ACTION_PATH);

// The steps of the composite: each starts at a four-space `- name:` line.
function actionStepBlock(name: string): string[] {
  const lines = action.split('\n');
  const start = lines.findIndex((line) => line === `    - name: ${name}`);
  if (start === -1) throw new Error(`no step named "${name}" in the composite`);
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^ {4}- name: /.test(line)) break;
    body.push(line);
  }
  return body;
}

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

// The e2e job is the only caller that installs Playwright.
const e2e = ciJobBlock(workflow, 'e2e');
if (e2e === null) throw new Error('no job named "e2e" in ci.yml');
const checks = ciJobBlock(workflow, 'checks');
if (checks === null) throw new Error('no job named "checks" in ci.yml');

const e2eSetup = ciStepBlock(e2e, 'Setup pnpm, Node and dependencies');
const checksSetup = ciStepBlock(checks, 'Setup pnpm, Node and dependencies');
const cache = actionStepBlock('Cache Playwright browsers');
const systemDeps = actionStepBlock('Install Playwright system dependencies');
const browsers = actionStepBlock('Install Playwright browsers');

describe('ci.yml e2e Playwright install, through the setup composite', () => {
  it('calls the composite from the e2e job with Playwright turned on', () => {
    expect(e2eSetup).toContain(`        uses: ./${COMPOSITE}`);
    expect(e2eSetup).toContain("          playwright: 'true'");
    expect(e2eSetup).toContain('          node-auth-token: ${{ secrets.GITHUB_TOKEN }}');
  });

  it('leaves Playwright off in the checks job', () => {
    expect(checksSetup).toContain(`        uses: ./${COMPOSITE}`);
    expect(checksSetup.join('\n')).not.toContain('playwright:');
  });

  it('keeps the Playwright steps out of the workflow itself', () => {
    expect(e2e.join('\n')).not.toContain('Install Playwright');
    expect(e2e.join('\n')).not.toContain('--with-deps');
    expect(e2e.join('\n')).not.toContain('playwright install');
  });

  it('caches the Playwright browsers with a SHA-pinned actions/cache, only when Playwright is on', () => {
    expect(cache.join('\n')).toMatch(/uses: actions\/cache@[0-9a-f]{40} # v\d+\.\d+\.\d+/);
    expect(cache).toContain('        path: ~/.cache/ms-playwright');
    expect(cache).toContain("      if: inputs.playwright == 'true'");
  });

  it('keys the browser cache on the locked Playwright version, with no fallback', () => {
    expect(cache).toContain(
      '        key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}'
    );
    expect(cache.some((line) => line.trim().startsWith('restore-keys'))).toBe(false);
    const versionStep = actionStepBlock('Get Playwright version');
    expect(versionStep.join('\n')).toContain("require('@playwright/test/package.json')");
    expect(versionStep).toContain('      id: playwright-version');
  });

  it('runs the apt system-dependency install before the browser download', () => {
    const names = action.split('\n').filter((line) => /^ {4}- name: /.test(line));
    const index = (name: string) => names.indexOf(`    - name: ${name}`);
    expect(index('Install Playwright system dependencies')).toBeGreaterThanOrEqual(0);
    expect(index('Install Playwright system dependencies')).toBeLessThan(
      index('Install Playwright browsers')
    );
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

  it('gates both Playwright install steps on the playwright input', () => {
    expect(systemDeps).toContain("      if: inputs.playwright == 'true'");
    expect(browsers).toContain("      if: inputs.playwright == 'true'");
  });
});
