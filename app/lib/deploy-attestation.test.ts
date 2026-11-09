import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The deploy job signs the pushed image and proves the signature before it
// offers the digest to the host. These tests pin the shape of that job in
// .github/workflows/ci.yml, because a reordered or skippable attestation step
// would still leave a green workflow while the image went out unsigned.

const workflow = readFileSync(resolve(__dirname, '../../.github/workflows/ci.yml'), 'utf8');

const SIGNER = 'branchLeft/website/.github/workflows/ci.yml';
const STEP_HEADER = /^ {6}- name: (.+)$/gm;

function deployJob(): string {
  const start = workflow.indexOf('\n  deploy:\n');
  expect(start, 'the deploy job exists').toBeGreaterThan(-1);
  return workflow.slice(start);
}

/** The text of one step of the deploy job, from its `- name:` line to the next. */
function step(name: string): string {
  const job = deployJob();
  const headers = [...job.matchAll(STEP_HEADER)];
  const index = headers.findIndex((match) => match[1] === name);
  expect(index, `deploy job has a step named "${name}"`).toBeGreaterThan(-1);
  const from = headers[index].index as number;
  const to = headers[index + 1]?.index ?? job.length;
  return withoutComments(job.slice(from, to));
}

/** Comment lines explain a step; they must not satisfy or trip a check on its keys. */
function withoutComments(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');
}

const GUARDED_STEPS = [
  'Fetch the attestation verifier scripts at a pinned commit',
  'Attest the pushed image',
  'Verify the attestation through the GitHub API and from the registry',
  'Prove a wrong identity is rejected',
];

const HOST_STEP = 'Pin app1 to the pushed digest and restart the stack';

describe('website deploy job attestation', () => {
  it('signs, verifies and proves the control before the host is told the digest', () => {
    const job = deployJob();
    const positions = [...GUARDED_STEPS, HOST_STEP].map((name) => job.indexOf(`- name: ${name}`));
    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it.each(GUARDED_STEPS)('cannot skip or wave through: %s', (name) => {
    const text = step(name);
    expect(text).not.toMatch(/^\s+if:/m);
    expect(text).not.toMatch(/continue-on-error/);
  });

  it('names the signer as a literal, never from this run', () => {
    const verify = step('Verify the attestation through the GitHub API and from the registry');
    const prove = step('Prove a wrong identity is rejected');
    expect(verify).toContain(`SIGNER_WORKFLOW: ${SIGNER}`);
    expect(prove).toContain(SIGNER);
    expect(withoutComments(workflow)).not.toMatch(/workflow_ref/);
  });

  it('verifies both through the API and from the registry bundle', () => {
    const verify = step('Verify the attestation through the GitHub API and from the registry');
    expect(verify).toContain('verify "through the GitHub API"');
    expect(verify).toContain('verify "from the registry bundle" --bundle-from-oci');
  });

  it('stores the bundle beside the image so a host needs no token', () => {
    expect(step('Attest the pushed image')).toMatch(/push-to-registry: true/);
  });

  it('fetches the verifier scripts at a full commit, not a branch', () => {
    const fetch = step('Fetch the attestation verifier scripts at a pinned commit');
    expect(fetch).toMatch(/ref: [0-9a-f]{40}\n/);
    expect(fetch).toMatch(/persist-credentials: false/);
  });

  it('grants signing permissions to the deploy job only', () => {
    const top = withoutComments(workflow.slice(0, workflow.indexOf('\njobs:\n')));
    expect(top).not.toMatch(/id-token/);
    expect(top).not.toMatch(/attestations/);
    const job = deployJob();
    expect(job).toMatch(/id-token: write/);
    expect(job).toMatch(/attestations: write/);
  });
});
