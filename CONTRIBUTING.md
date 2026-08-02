# Contributing to branchLeft/website

This repo follows the [org-wide contribution guide](https://github.com/branchLeft/.github/blob/main/CONTRIBUTING.md) — fork, branch, PR, squash-merge, one required review. This file covers what's specific to `website`.

## Prerequisites

- Node version pinned in [.nvmrc](.nvmrc) — run `nvm use` before anything else.
- [pnpm](https://pnpm.io) as the package manager.

## Setup

```bash
nvm use
pnpm install --frozen-lockfile
cp .env.example .env   # fill in any values you need locally
```

`website` depends on `@branchleft/components`, which is currently published only to GitHub Packages. If you don't have a GitHub PAT with `read:packages` configured (see [.npmrc](.npmrc)), `pnpm install` will fail. **This means CI on a fork PR will currently fail at the install step** — a maintainer will run checks locally until this is resolved (tracked in `BACKLOG.md`). Don't let this stop you from opening the PR.

## Checks CI runs on every PR

These are exactly what [.github/workflows/ci.yml](.github/workflows/ci.yml) runs — matching them locally means no surprises:

```bash
pnpm typecheck            # react-router typegen + tsc
pnpm test:unit --run --coverage
pnpm test:e2e              # Playwright + axe-core; requires: pnpm exec playwright install --with-deps chromium
```

## Pre-commit hooks

This repo uses [pre-commit](https://pre-commit.com) (config in [.pre-commit-config.yaml](.pre-commit-config.yaml)) to run formatting, linting, and unit tests automatically on `git commit`:

```bash
pip install pre-commit   # or: brew install pre-commit
pre-commit install
```

If a hook fails, it usually auto-fixes the issue (Prettier, whitespace) — re-stage and commit again. For lint/test failures you'll need to fix the reported issue yourself. Skipping hooks with `--no-verify` is discouraged; CI runs the same checks anyway.

## Accessibility

Every route needs a Playwright test asserting zero axe violations — see `CLAUDE.md` → Testing. Accessibility failures block merge; this isn't optional.

## Content & copy

Don't write real prose on the user's behalf in route changes — use placeholder tokens (see `CLAUDE.md` → Project Conventions → Content & Copy). This mainly affects internal changes; external contributors fixing bugs or behavior won't usually touch copy.
