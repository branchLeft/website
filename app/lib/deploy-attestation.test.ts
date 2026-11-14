// @vitest-environment node

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// The deploy job signs the image it pushed and proves the signature before any
// step that reaches app1, so a digest that was not built and attested by this
// workflow never gets a deploy. The workflow is read as text, the way
// dockerfile-pins.test.ts reads the Dockerfile.
const WORKFLOW_PATH = '.github/workflows/ci.yml';
const SIGNER_WORKFLOW = `branchLeft/website/${WORKFLOW_PATH}`;
const ATTEST_ACTION =
  /^branchLeft\/github-workflows\/\.github\/actions\/attest-and-verify-image@[0-9a-f]{40}\b/;
const DEPLOY_JOB = 'deploy';

const source = readFileSync(new URL(`../../${WORKFLOW_PATH}`, import.meta.url), 'utf8');

// Comment-only lines are dropped, so a step that is only commented out does not count.
const lines = source.split('\n').filter((line) => !/^\s*#/.test(line));

const jobsAt = lines.indexOf('jobs:');
const header = lines.slice(0, jobsAt);

function jobs(): Map<string, string[]> {
  const result = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of lines.slice(jobsAt + 1)) {
    const start = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (start) {
      current = [];
      result.set(start[1], current);
    } else if (current) {
      current.push(line);
    }
  }
  return result;
}

// Each step starts at a "      - " line, six spaces in, and runs to the next one.
function steps(job: string[]): string[] {
  const result: string[] = [];
  for (const line of job) {
    if (/^ {6}- /.test(line)) result.push(line);
    else if (result.length > 0) result[result.length - 1] += `\n${line}`;
  }
  return result;
}

function stepInput(step: string, key: string): string | undefined {
  const match = new RegExp(`^ {10}${key}:\\s*(.+?)\\s*$`, 'm').exec(step);
  return match?.[1];
}

const allJobs = jobs();
const deploySteps = steps(allJobs.get(DEPLOY_JOB) ?? []);
const digestAt = deploySteps.findIndex((step) => /^ {8}id: digest$/m.test(step));
const attestAt = deploySteps.findIndex((step) => {
  const uses = /^ {8}uses:\s*(\S+)/m.exec(step)?.[1] ?? '';
  return ATTEST_ACTION.test(uses);
});
const firstSshAt = deploySteps.findIndex((step) => /ssh/i.test(step));

describe('website deploy attestation', () => {
  it('has a deploy job, a digest step and an attest step to check', () => {
    expect(deploySteps.length).toBeGreaterThan(0);
    expect(digestAt).toBeGreaterThanOrEqual(0);
    expect(attestAt).toBeGreaterThanOrEqual(0);
    expect(firstSshAt).toBeGreaterThanOrEqual(0);
  });

  it('attests and verifies the digest after it is resolved and before any step that touches ssh', () => {
    expect(attestAt).toBeGreaterThan(digestAt);
    expect(attestAt).toBeLessThan(firstSshAt);
  });

  it('uses the shared action pinned by full commit sha, once', () => {
    const uses = deploySteps.filter((step) =>
      ATTEST_ACTION.test(/^ {8}uses:\s*(\S+)/m.exec(step)?.[1] ?? '')
    );
    expect(uses).toHaveLength(1);
  });

  it('passes this image, this repository and this workflow as literals, and the resolved digest', () => {
    const step = deploySteps[attestAt];
    expect(stepInput(step, 'image')).toBe('ghcr.io/branchleft/website');
    expect(stepInput(step, 'repo')).toBe('branchLeft/website');
    expect(stepInput(step, 'signer-workflow')).toBe(SIGNER_WORKFLOW);
    expect(stepInput(step, 'digest')).toBe('${{ steps.digest.outputs.digest }}');
    expect(step).not.toMatch(/workflow_ref/);
  });

  it('cannot be skipped or allowed to fail', () => {
    const step = deploySteps[attestAt];
    expect(step).not.toMatch(/^ {8}if:/m);
    expect(step).not.toMatch(/continue-on-error/);
  });

  it('grants id-token and attestations to the deploy job alone', () => {
    const grant = /^\s+(id-token|attestations):/;
    expect(header.filter((line) => grant.test(line))).toEqual([]);
    for (const [name, job] of allJobs) {
      const granted = job.filter((line) => grant.test(line));
      if (name === DEPLOY_JOB) {
        expect(granted.map((line) => line.trim())).toEqual([
          'id-token: write',
          'attestations: write',
        ]);
      } else {
        expect(granted, `job ${name}`).toEqual([]);
      }
    }
  });
});
