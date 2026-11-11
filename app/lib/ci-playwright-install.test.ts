// @vitest-environment node

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// The e2e job's Playwright install. The system dependencies (apt) and the
// browser download each run as their own step, with a step timeout and a
// bounded retry that fails closed, so a runner-network fault cannot hang the job.
const JOB = 'e2e';
const WORKFLOW_STEP = /^ {6}- /;

const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

// The lines of one job: from its key (two-space indent) to the next job key.
function jobBlock(source: string, name: string): string[] {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => line === `  ${name}:`);
  if (start === -1) throw new Error(`no job named "${name}" in ci.yml`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end);
}

// The lines of one step: from its `- name:` line to the next step in the job.
function stepBlock(job: string[], name: string): string[] {
  const start = job.findIndex((line) => line.trim() === `- name: ${name}`);
  if (start === -1) throw new Error(`no step named "${name}" in the job`);
  const body: string[] = [];
  for (const line of job.slice(start + 1)) {
    if (WORKFLOW_STEP.test(line)) break;
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
function expectRetryFailsClosed(step: string[], installCommand: string, errorText: string): void {
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
  expect(script[successExit - 1]).toBe(`if timeout 120 ${installCommand}; then`);
}

const job = jobBlock(workflow, JOB);
const cache = stepBlock(job, 'Cache Playwright browsers');
const systemDeps = stepBlock(job, 'Install Playwright system dependencies');
const browsers = stepBlock(job, 'Install Playwright browsers');

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
    const versionStep = stepBlock(job, 'Get Playwright version');
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

  it('gives the browser download a step timeout', () => {
    expect(browsers.some((line) => /^ {8}timeout-minutes: \d+$/.test(line))).toBe(true);
  });

  it('system-dependency retry fails closed: its last failed attempt prints ::error:: and exits 1', () => {
    expectRetryFailsClosed(
      systemDeps,
      'pnpm exec playwright install-deps chromium webkit',
      'install-deps failed after 3 attempts'
    );
  });

  it('browser retry fails closed: its last failed attempt prints ::error:: and exits 1', () => {
    expectRetryFailsClosed(
      browsers,
      'pnpm exec playwright install chromium webkit',
      'browser install failed after 3 attempts'
    );
  });

  it('no longer installs apt dependencies through --with-deps', () => {
    expect(job.join('\n')).not.toContain('--with-deps');
    expect(browsers.join('\n')).not.toContain('install-deps');
  });
});
