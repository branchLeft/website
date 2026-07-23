# CLAUDE.md — branchLeft Website

## Stack

- **Runtime/Package manager:** Node.js, pnpm
- **Framework:** React 19 + React Router v7 (SSR, `react-router.config.ts`)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`
- **Build:** Vite 8
- **Tests:** Playwright + axe-core

## Routing Strategy

This app is locked to **React Router v7 Framework Mode + SSR**. These decisions are final:

- **Mode**: Framework Mode — `@react-router/dev` + `reactRouter()` Vite plugin. This is the most expressive mode and the natural upgrade path to RSC.
- **SSR**: Always on (`ssr: true` in `react-router.config.ts`). Do not set `ssr: false`.
- **Route config**: Manual `app/routes.ts` using `route()`, `index()`, `layout()`, and `prefix()` helpers. No file-system routing (`flatRoutes`).
- **Pre-rendering**: Not yet active. Pattern is documented in `react-router.config.ts`. To opt a route in, add its path to the `prerender` array — appropriate for routes with no dynamic data.
- **SPA mode**: Prohibited.
- **RSC**: Not active. It is the future direction but is currently unstable. Do not introduce RSC APIs.

For detailed patterns and doc pointers, see `.agents/skills/react-router/`.

## Commands

### Non-interactive (safe to run directly)

```bash
pnpm build               # production build
pnpm typecheck           # react-router typegen + tsc
pnpm test:unit --run     # single Vitest pass — ALWAYS use --run to avoid watch mode
pnpm lint                # eslint --fix
pnpm format              # prettier --write
```

### Long-running servers — async terminal mode only

These commands block indefinitely. Only start them in a background/async terminal; never `await` them in a script or agent task.

```bash
pnpm dev     # React Router dev server (HMR)
pnpm start   # serve production build
```

### Installing dependencies

```bash
pnpm install --frozen-lockfile   # CI-safe install; never prompts
```

## Pre-Commit Hooks

Hooks are managed by [pre-commit](https://pre-commit.com) and defined in `.pre-commit-config.yaml`.

### What runs on commit

1. **pre-commit-hooks** — trailing whitespace, end-of-file fixer, YAML check, large-file guard, merge-conflict check
2. **Prettier** — formats `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.yml`, `.yaml`, `.md`
3. **ESLint** — lints `.js`, `.jsx`, `.ts`, `.tsx`
4. **Vitest** — runs `pnpm test:unit` (single pass) against any changed source files

If a commit is blocked, fix the reported issues and re-commit.

## Project Conventions

### Content & Copy

- **Never write prose or copy on behalf of the user.** Use ALL_CAPS placeholder tokens instead: `HEADING_CONTENT`, `BODY_TEXT`, `CTA_LABEL`, `IMAGE_ALT`, etc.
- Placeholder tokens live directly in JSX as string literals or comments — they must be obviously synthetic.

### Styling

- All visual decisions flow from a central theme (colours, spacing scale, typography) defined in `app/theme.css` or Tailwind config — never hardcode one-off values.
- Prefer Tailwind utility classes. Extend the theme rather than overriding with arbitrary values.
- Designs should be simple. Favour whitespace, contrast, and hierarchy over decoration.
- **Responsive-first:** every component must work at `sm`, `md`, `lg`, and `xl` breakpoints. Test at 375 px and 1440 px minimum.

### Components

- Reusable, domain-agnostic UI components belong in the separate shared component repo (open-source). Import them as a package dependency.
- Route-specific, one-off components live in `app/components/` and are candidates for extraction later.
- All components must be accessible: semantic HTML, ARIA where required, keyboard navigable.

### Routes

- One file per route under `app/routes/`. Use the React Router v7 file-based convention.
- `meta()` exports are required on every route — use placeholder values until real copy is confirmed.
- Loaders/actions stay in the route file unless shared; extract to `app/lib/` when reused.

### Code Quality

- TypeScript strict mode. No `any`. Run `pnpm typecheck` before committing.
- No default exports except route modules and `root.tsx`.
- Imports are absolute from `app/` (configure path alias in `vite.config.ts` if not already set).

## Testing

- **Tool:** Playwright with `@axe-core/playwright`.
- Every page/route must have a Playwright test that:
  1. Navigates to the route.
  2. Runs `checkA11y()` and asserts zero violations.
  3. Covers at least one critical user interaction (if applicable).
- Tests live in `tests/` at the repo root.
- Accessibility failures are treated as build-blocking errors.

## Open Source

- All code in this repo is public. Do not commit secrets, credentials, or personally identifying information.
- Use environment variables (`.env`, never committed) for any runtime config.
- Keep dependencies minimal and well-maintained.
