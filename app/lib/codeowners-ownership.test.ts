// @vitest-environment node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
  ['tsconfig.json', '1: CI-config file'],
  ['.github/workflows/ci.yml', '3: required checks and the deploy'],
  ['.github/workflows/codeql.yml', '3: grants a write permission'],
  ['.github/workflows/standards.yml', '3: required check, shared line'],
  ['.github/workflows/docs-lint.yml', '3: required check, shared line'],
  ['.github/actions/setup-pnpm-node/action.yml', '3: local action ci.yml calls'],
  ['.standards.mode', '1: exemption and floor file'],
  ['app/routes/privacy.tsx', '8: legal text'],
  ['LICENSE', '8: legal text'],
  ['README.md', '8: top-level doc for other people'],
  ['app/routes/home.tsx', '8: marketing prose'],
  ['app/lib/codeowners-ownership.test.ts', '1: the test of this file'],
];

// One path per released class, and the paths that matched by name only.
const UNOWNED: ReadonlyArray<readonly [string, string]> = [
  ['package.json', 'released: dependency bumps land on agent review'],
  ['pnpm-workspace.yaml', 'released'],
  ['.npmrc', 'released'],
  ['Dockerfile', 'released'],
  ['deploy/compose.yml', 'released'],
  ['app/lib/sendContactEmail.server.ts', 'released'],
  ['app/routes.ts', 'released: route table'],
  ['app/components/Button.tsx', 'released: components'],
  ['public/robots.txt', 'released: public files'],
  ['.github/dependabot.yml', 'released: update settings'],
  ['pnpm-lock.yaml', 'lockfile'],
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

// The hold rule, read from the workflow text itself. A workflow or local action
// stays owned when it names a secret other than GITHUB_TOKEN, carries an
// environment, grants any write permission, has no explicit permissions block,
// or declares secrets on workflow_call. A file that matches and is not owned
// turns this test red, so a new workflow cannot be released by accident.
function holdReasons(text: string, isAction: boolean): string[] {
  const out: string[] = [];
  if (
    /(?<![\w-])secrets\.(?!GITHUB_TOKEN\b)[A-Za-z_]/.test(text) ||
    /(?<![\w-])secrets\[/.test(text) ||
    /secrets:\s*inherit/.test(text)
  ) {
    out.push('secrets');
  }
  if (/^\s+environment:/m.test(text)) out.push('environment');
  if (/^\s+[a-z-]+:\s*write\s*(#.*)?$/m.test(text) || /permissions:\s*write-all/.test(text)) {
    out.push('write permission');
  }
  if (/workflow_call:/.test(text) && /^\s{4}secrets:\s*$/m.test(text)) {
    out.push('workflow_call secrets');
  }
  if (!isAction && !/^permissions:/m.test(text)) {
    const jobsAt = text.search(/^jobs:\s*$/m);
    const body = jobsAt < 0 ? '' : text.slice(jobsAt).replace(/^jobs:\s*\n/, '');
    const jobs = body.split(/^ {2}(?=[A-Za-z0-9_.-]+:\s*(?:#.*)?$)/m).slice(1);
    if (jobs.length === 0 || jobs.some((job) => !/^ {4}permissions:/m.test(job))) {
      out.push('no permissions block');
    }
  }
  return out;
}

function automationFiles(): string[] {
  const found: string[] = [];
  const workflows = rootFile('.github/workflows');
  if (existsSync(workflows)) {
    for (const name of readdirSync(workflows)) {
      if (/\.ya?ml$/.test(name)) found.push(`.github/workflows/${name}`);
    }
  }
  const actions = rootFile('.github/actions');
  if (existsSync(actions)) {
    for (const dir of readdirSync(actions)) {
      for (const leaf of ['action.yml', 'action.yaml']) {
        if (existsSync(rootFile(`.github/actions/${dir}/${leaf}`))) {
          found.push(`.github/actions/${dir}/${leaf}`);
        }
      }
    }
  }
  return found.sort();
}

describe('CODEOWNERS holds every workflow that matches the rule', () => {
  const files = automationFiles();

  it('finds the workflows', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is owned when the rule matches it', (path) => {
    const text = readFileSync(rootFile(path), 'utf8');
    const reasons = holdReasons(text, path.startsWith('.github/actions/'));
    if (reasons.length > 0) {
      expect(ownersOf(rules, path), `${path} (${reasons.join(', ')})`).toEqual([OWNER]);
    }
  });
});
