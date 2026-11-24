// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { ciJobBlock, readRepoFile } from './test-helpers/repo-text';

// The consumer check: the job that refuses an installed @branchleft package
// that is neither listed as published before attestation began nor attested.
const JOB = 'verify-package-attestations';
const ACTION = 'branchLeft/github-workflows/.github/actions/verify-package-attestations';
// The pin is read from the workflow, never copied here, so a Dependabot bump of
// the action needs no edit to this test. The test checks its shape, not its value.

const workflow = readRepoFile('.github/workflows/ci.yml');

// The keys under the job's `permissions:` mapping, as written.
function jobPermissions(block: string[]): string[] {
  const at = block.findIndex((line) => line === '    permissions:');
  if (at === -1) return [];
  const keys: string[] = [];
  for (const line of block.slice(at + 1)) {
    if (!/^ {6}\S/.test(line)) break;
    keys.push(line.trim());
  }
  return keys;
}

// Every `uses:` line of the job that names the verify action.
function verifyUses(block: string[]): string[] {
  return block.map((line) => line.trim()).filter((line) => line.startsWith(`uses: ${ACTION}`));
}

describe('CI verify-package-attestations job', () => {
  const block = ciJobBlock(workflow, JOB);

  it('exists in the CI workflow', () => {
    expect(block).not.toBeNull();
  });

  it('calls the verify action once', () => {
    expect(verifyUses(block ?? [])).toHaveLength(1);
  });

  it('pins the action to the release commit with its version comment, never a tag', () => {
    const [uses] = verifyUses(block ?? []);
    expect(uses.startsWith(`uses: ${ACTION}@`)).toBe(true);
    expect(uses).toMatch(/@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
  });

  it('grants exactly contents: read and packages: read on the job', () => {
    expect(jobPermissions(block ?? [])).toEqual(['contents: read', 'packages: read']);
  });

  it('does not run on a self-hosted runner', () => {
    expect(block).toContain('    runs-on: ubuntu-latest');
  });

  it('bounds the job with timeout-minutes', () => {
    expect((block ?? []).some((line) => /^ {4}timeout-minutes: \d+$/.test(line))).toBe(true);
  });
});

describe('CI verify-package-attestations job parser', () => {
  const sample = [
    'jobs:',
    '  one:',
    '    permissions:',
    '      contents: read',
    '      id-token: write',
    '    steps:',
    '      - uses: a/b@v1',
    '  two:',
    '    steps: []',
  ].join('\n');

  it('stops a job at the next job key', () => {
    expect(ciJobBlock(sample, 'one')).toHaveLength(6);
  });

  it('reports a widened permission set', () => {
    expect(jobPermissions(ciJobBlock(sample, 'one') ?? [])).toEqual([
      'contents: read',
      'id-token: write',
    ]);
  });

  it('returns null for a job that is absent', () => {
    expect(ciJobBlock(sample, 'missing')).toBeNull();
  });
});
