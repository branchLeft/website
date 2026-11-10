import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// The base image digest is the index of node:26.13.0-alpine, the base the image
// scan was run against on 2026-11-10. Grype reported one critical (zlib) and
// npm-bundled highs in it; the pins below clear them.
const SCANNED_BASE_DIGEST = 'sha256:8996bb5821d62a8fd9bb27c1cb07462f3fdce6e47d640c6a881ead0b064ce216';

const dockerfile = readFileSync(new URL('../../Dockerfile', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  packageManager: string;
};

function fromLines(source: string): string[] {
  return source.split('\n').filter((line) => /^FROM\s/.test(line));
}

// The image each FROM names: the word after FROM, unless it is an earlier stage alias.
function externalImages(source: string): string[] {
  const aliases = new Set<string>();
  const images: string[] = [];
  for (const line of fromLines(source)) {
    const [, image, , alias] = line.trim().split(/\s+/);
    if (!aliases.has(image)) images.push(image);
    if (alias) aliases.add(alias);
  }
  return images;
}

describe('Dockerfile pins', () => {
  it('pins every external base image by digest, never by tag alone', () => {
    const images = externalImages(dockerfile);
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image).toMatch(/@sha256:[0-9a-f]{64}$/);
    }
  });

  it('uses the scanned base digest for the base image', () => {
    const baseLine = fromLines(dockerfile)[0];
    expect(baseLine).toBe(`FROM node@${SCANNED_BASE_DIGEST} AS base`);
  });

  it('pins zlib to the alpine 3.24 release that fixes CVE-2026-4738', () => {
    expect(dockerfile).toMatch(/^RUN apk add --no-cache zlib=1\.4-r0$/m);
  });

  it('pins the global npm and pnpm releases that carry the fixed bundled packages', () => {
    expect(dockerfile).toMatch(/^RUN npm install --global npm@12\.2\.2 pnpm@11\.28\.11$/m);
    expect(dockerfile).not.toMatch(/pnpm@11\.17\.0/);
  });

  it('keeps the image pnpm equal to the repository packageManager', () => {
    expect(packageJson.packageManager).toBe('pnpm@11.28.11');
    expect(dockerfile).toContain(`pnpm@${packageJson.packageManager.split('@')[1]}`);
  });
});
