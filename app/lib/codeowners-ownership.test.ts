// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// Proof for .github/CODEOWNERS. GitHub applies the LAST matching pattern, so
// this reads the file, matches each sample path the way GitHub does, and says
// whether the owner team owns it. The file is read from CODEOWNERS_FILE when
// that is set (to prove an older copy of the file), else from .github/CODEOWNERS.

const OWNER = '@branchLeft/branchleft-admin';

interface Rule {
  pattern: string;
  owners: string[];
}

const CATCH_ALLS = new Set(['*', '**', '/*', '/**', '**/*']);

function rootFile(relative: string): string {
  return resolve(new URL('../..', import.meta.url).pathname, relative);
}

function codeownersPath(): string {
  const override = process.env.CODEOWNERS_FILE;
  return override ? resolve(process.cwd(), override) : rootFile('.github/CODEOWNERS');
}

function parseRules(source: string): Rule[] {
  const rules: Rule[] = [];
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const [pattern, ...owners] = line.split(/\s+/);
    rules.push({ pattern, owners });
  }
  return rules;
}

// A gitignore-style pattern as GitHub reads it in CODEOWNERS: a leading slash
// anchors to the root, a trailing slash means a directory and everything under
// it, a pattern with no slash matches at any depth, `*` stays inside one path
// segment and `**` crosses segments.
function patternRegex(pattern: string): RegExp {
  const anchored = pattern.startsWith('/');
  let body = pattern.replace(/^\/+/, '');
  const directoryOnly = body.endsWith('/');
  body = body.replace(/\/+$/, '');
  if (!anchored && !body.includes('/')) body = `**/${body}`;
  let out = '';
  let i = 0;
  while (i < body.length) {
    if (body.startsWith('**/', i)) {
      out += '(?:.*/)?';
      i += 3;
    } else if (body.startsWith('/**', i) && i + 3 === body.length) {
      out += '/.*';
      i += 3;
    } else if (body[i] === '*') {
      out += '[^/]*';
      i += 1;
    } else if (body[i] === '?') {
      out += '[^/]';
      i += 1;
    } else {
      out += body[i].replace(/[.+^${}()|[\]\\]/g, '\\$&');
      i += 1;
    }
  }
  const tail = directoryOnly ? '/.*' : '(?:/.*)?';
  return new RegExp(`^${out}${tail}$`);
}

function ownersOf(rules: Rule[], path: string): string[] {
  let found: string[] = [];
  for (const rule of rules) {
    if (patternRegex(rule.pattern).test(path)) found = rule.owners;
  }
  return found;
}

const source = readFileSync(codeownersPath(), 'utf8');
const rules = parseRules(source);

// One path per kept criterion. Each names the criterion it proves.
const OWNED: ReadonlyArray<readonly [string, string]> = [
  ['.github/CODEOWNERS', '1: the rules themselves'],
  ['CLAUDE.md', '1: agent guidance'],
  ['.claude/.gitignore', '1: agent guidance directory'],
  ['tools/floors.tsv', '1: floor file'],
  ['vitest.config.ts', '1: coverage thresholds CI reads'],
  ['package.json', '1 and 2: scripts CI calls, lifecycle scripts run with the token'],
  ['pnpm-workspace.yaml', '2: allowBuilds, the install-script allow list'],
  ['.npmrc', '2: registry auth'],
  ['Dockerfile', '2: image build mounts the registry token'],
  ['deploy/compose.yml', '2: SMTP credential wiring'],
  ['app/lib/sendContactEmail.server.ts', '2 and 4: reads the SMTP credentials'],
  ['.github/workflows/ci.yml', '3: workflows that reach secrets'],
  ['.standards.mode', '1: exemption and floor file'],
  ['public/robots.txt', '5: public files'],
  ['app/routes/privacy.tsx', '8: legal text'],
  ['LICENSE', '8: legal text'],
  ['app/lib/codeowners-ownership.test.ts', '1: the test of this file'],
];

// One path per released class, and the paths that matched by name only.
const UNOWNED: ReadonlyArray<readonly [string, string]> = [
  ['pnpm-lock.yaml', 'lockfile'],
  ['README.md', 'document'],
  ['deploy/RUNBOOK-app1-website.md', 'document inside a once-owned directory'],
  ['app/lib/dockerfile-pins.test.ts', 'test of a released file'],
  ['tests/home.spec.ts', 'end-to-end test'],
  ['app/styles/theme.css', 'styles'],
  ['app/lib/security-headers.ts', 'no criterion names it'],
  ['vite.config.ts', 'runs only in steps that hold no secret'],
  ['.nvmrc', 'version pin'],
  ['tests/approval-flow.spec.ts', 'name only: approv'],
  ['app/lib/guard-notes.ts', 'name only: guard'],
  ['scripts/format.py', 'name only: scripts directory'],
];

describe('CODEOWNERS file shape', () => {
  it('has rules', () => {
    expect(rules.length).toBeGreaterThan(0);
  });

  it('has no catch-all line', () => {
    expect(rules.filter((rule) => CATCH_ALLS.has(rule.pattern))).toEqual([]);
  });

  it('names only the owner team on every line', () => {
    for (const rule of rules) {
      expect(rule.owners, rule.pattern).toEqual([OWNER]);
    }
  });
});

describe('CODEOWNERS ownership of sample paths', () => {
  it.each(OWNED)('owns %s (%s)', (path) => {
    expect(ownersOf(rules, path)).toEqual([OWNER]);
  });

  it.each(UNOWNED)('does not own %s (%s)', (path) => {
    expect(ownersOf(rules, path)).toEqual([]);
  });
});
