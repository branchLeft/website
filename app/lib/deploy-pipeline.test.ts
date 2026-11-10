import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// A push to main builds, pushes, scans, attests and then deploys the website
// image, in that order. A reordered, skippable or hand-copied step would still
// leave a green workflow while an unscanned or unsigned image reached app1, so
// these tests pin the shape of that pipeline in .github/workflows/ci.yml.

const workflow = readFileSync(resolve(__dirname, '../../.github/workflows/ci.yml'), 'utf8');

const SHARED = 'branchLeft/github-workflows';
const PIN = 'v1.1.0';
// The standards require an action to be pinned to a full commit; the reusable
// scan workflow is pinned to the tag, as docs-lint is. This is the commit the
// v1.1.0 tag points at.
const PIN_COMMIT = '77506b6d4603ef432bbdec734139fec91e5bea47';
const SCAN_USES = `${SHARED}/.github/workflows/image-scan.yml@${PIN}`;
const ATTEST_USES = `${SHARED}/.github/actions/attest-and-verify-image@${PIN_COMMIT}`;
const SIGNER = 'branchLeft/website/.github/workflows/ci.yml';
const DIGEST_OUTPUT = '${{ needs.publish.outputs.digest }}';
const JOB_HEADER = /^ {2}([a-z][a-z0-9-]*):[ \t]*$/gm;

/** Comment lines explain a job; they must not satisfy or trip a check on its keys. */
function withoutComments(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');
}

const code = withoutComments(workflow);

function jobsSection(text: string): string {
  const start = text.indexOf('\njobs:\n');
  expect(start, 'the workflow has a jobs section').toBeGreaterThan(-1);
  return text.slice(start);
}

/** The text of one job, from its `  name:` line to the next job's. Comments removed. */
function job(name: string): string {
  const section = jobsSection(workflow);
  const headers = [...section.matchAll(JOB_HEADER)];
  const index = headers.findIndex((match) => match[1] === name);
  expect(index, `the workflow has a job named "${name}"`).toBeGreaterThan(-1);
  const from = headers[index].index as number;
  const to = headers[index + 1]?.index ?? section.length;
  return withoutComments(section.slice(from, to));
}

function needs(name: string): string[] {
  const match = job(name).match(/^ {4}needs: \[([^\]]*)\]/m);
  expect(match, `job "${name}" lists its needs in flow style`).not.toBeNull();
  return (match as RegExpMatchArray)[1].split(',').map((entry) => entry.trim());
}

/** The text of one step of one job, from its `- name:` line to the next. */
function step(jobName: string, stepName: string): string {
  const text = job(jobName);
  const headers = [...text.matchAll(/^ {6}- name: (.+)$/gm)];
  const index = headers.findIndex((match) => match[1] === stepName);
  expect(index, `job "${jobName}" has a step named "${stepName}"`).toBeGreaterThan(-1);
  const from = headers[index].index as number;
  const to = headers[index + 1]?.index ?? text.length;
  return text.slice(from, to);
}

/** The permissions block of a job: the keys listed under `permissions:` at job scope. */
function permissions(name: string): string {
  const match = job(name).match(/^ {4}permissions:(.*(?:\n {6}[a-z-]+: \w+)*)/m);
  expect(match, `job "${name}" declares its own permissions`).not.toBeNull();
  return (match as RegExpMatchArray)[1].trim();
}

describe('website production pipeline order', () => {
  it('runs publish, scan, attest and deploy as four jobs in that order', () => {
    const names = [...jobsSection(workflow).matchAll(JOB_HEADER)].map((match) => match[1]);
    const order = ['publish', 'scan', 'attest', 'deploy'].map((name) => names.indexOf(name));
    expect(order.every((position) => position > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('scans after the push, attests only after the scan, deploys only after both', () => {
    expect(needs('scan')).toContain('publish');
    expect(needs('attest')).toEqual(expect.arrayContaining(['publish', 'scan']));
    expect(needs('deploy')).toEqual(expect.arrayContaining(['publish', 'scan', 'attest']));
  });

  it('builds and pushes in the publish job only', () => {
    expect(job('publish')).toMatch(/docker push/);
    for (const name of ['scan', 'attest', 'deploy']) {
      expect(job(name)).not.toMatch(/docker (build|push)/);
    }
  });

  it('cannot skip or wave through the scan, the attestation or the deploy gate', () => {
    // The one status function allowed is the cleanup step that removes the
    // deploy key after a failure; it gates nothing.
    const cleanup = step('deploy', 'Remove the deploy SSH key');
    for (const name of ['scan', 'attest', 'deploy']) {
      const text = job(name).replace(cleanup, '');
      expect(text, name).not.toMatch(/continue-on-error/);
      expect(text, name).not.toMatch(/always\(\)|!cancelled\(\)|failure\(\)/);
    }
    expect(job('scan')).not.toMatch(/^ {4}if:/m);
  });

  it('only ever runs the publishing jobs on a push to main', () => {
    for (const name of ['publish', 'attest', 'deploy']) {
      expect(job(name), name).toContain(
        "if: github.event_name == 'push' && github.ref == 'refs/heads/main'"
      );
    }
  });
});

describe('website image scan', () => {
  it('calls the shared image-scan workflow at the v1.1.0 tag', () => {
    expect(job('scan')).toContain(`uses: ${SCAN_USES}`);
  });

  it('scans the pushed digest, never a tag', () => {
    const scan = job('scan');
    expect(scan).toContain(`image: \${{ needs.publish.outputs.image }}@${DIGEST_OUTPUT}`);
    expect(scan).not.toMatch(/IMAGE_TAG|github\.sha|:latest/);
  });

  it('receives the digest as a publish output resolved after the push', () => {
    const publish = job('publish');
    expect(publish).toContain('digest: ${{ steps.digest.outputs.digest }}');
    expect(publish.indexOf('docker push')).toBeLessThan(publish.indexOf('id: digest'));
  });

  it('refuses to attest unless the scan verdict is PASS', () => {
    const attest = job('attest');
    expect(attest).toContain('SCAN_VERDICT: ${{ needs.scan.outputs.verdict }}');
    expect(step('attest', 'Refuse to sign an image the scan did not pass')).toContain(
      '[ "$SCAN_VERDICT" != "PASS" ]'
    );
    expect(attest.indexOf('Refuse to sign')).toBeLessThan(attest.indexOf(ATTEST_USES));
  });
});

describe('website image attestation', () => {
  it('uses the shared attest-and-verify action at the commit of the v1.1.0 tag', () => {
    const attest = step('attest', 'Attest and verify the pushed image');
    expect(attest).toContain(`uses: ${ATTEST_USES} # ${PIN}`);
  });

  it('attests the pushed digest and names the signer as a literal', () => {
    const attest = step('attest', 'Attest and verify the pushed image');
    expect(attest).toContain('digest: ${{ env.DIGEST }}');
    expect(job('attest')).toContain(`DIGEST: ${DIGEST_OUTPUT}`);
    expect(attest).toContain(`signer-workflow: ${SIGNER}`);
    expect(attest).toContain('repo: branchLeft/website');
    expect(code).not.toMatch(/workflow_ref/);
  });

  it('carries no inline copy of the attest, verify or wrong-identity steps', () => {
    expect(code).not.toMatch(/attest-build-provenance/);
    expect(code).not.toMatch(/gh attestation/);
    expect(code).not.toMatch(/verify-image-attestation/);
    expect(code).not.toMatch(/prove-wrong-identity/);
    expect(code).not.toMatch(/bundle-from-oci/);
    expect(code).not.toMatch(/ghost-platform/);
    expect(code).not.toMatch(/\.attest-tools/);
  });

  it('pins every use of the shared workflows repository to v1.1.0', () => {
    const refs = [...code.matchAll(new RegExp(`uses: ${SHARED}/\\S+`, 'g'))].map(
      (match) => match[0]
    );
    expect(refs).toEqual([`uses: ${SCAN_USES}`, `uses: ${ATTEST_USES}`]);
  });
});

describe('website pipeline permissions', () => {
  it('grants no write or signing permission at workflow scope', () => {
    const top = code.slice(0, code.indexOf('\njobs:\n'));
    expect(top).not.toMatch(/id-token|attestations|: write/);
  });

  it('gives publish the registry write and nothing that signs', () => {
    const text = permissions('publish');
    expect(text).toContain('packages: write');
    expect(text).not.toMatch(/id-token|attestations/);
  });

  it('gives the scan read access only', () => {
    const text = permissions('scan');
    expect(text).toContain('contents: read');
    expect(text).toContain('packages: read');
    expect(text).not.toMatch(/write/);
  });

  it('gives signing permissions to the attest job alone', () => {
    const text = permissions('attest');
    expect(text).toContain('id-token: write');
    expect(text).toContain('attestations: write');
    expect(text).toContain('packages: write');
    for (const name of ['publish', 'scan', 'deploy']) {
      expect(job(name), name).not.toMatch(/id-token|attestations/);
    }
  });

  it('gives the deploy job no GitHub permission at all', () => {
    expect(job('deploy')).toMatch(/^ {4}permissions: \{\}$/m);
    expect(job('deploy')).not.toMatch(/actions\/checkout|docker\/login-action/);
  });
});

describe('website deploy', () => {
  it('pins app1 to the digest the publish job pushed, not to a tag', () => {
    const deploy = job('deploy');
    expect(deploy).toContain(`DIGEST: ${DIGEST_OUTPUT}`);
    expect(deploy).toContain('IMAGE: ${{ needs.publish.outputs.image }}');
    expect(deploy).not.toMatch(/steps\.digest|IMAGE_TAG|github\.sha/);
    expect(step('deploy', 'Pin app1 to the pushed digest and restart the stack')).toContain(
      'branchleft-deploy website $IMAGE@$DIGEST'
    );
  });
});
