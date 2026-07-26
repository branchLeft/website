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

**All visual decisions live in `app/theme.css` — nowhere else.** Route TSX must stay as close to bare semantic markup as possible. If you find yourself typing more than one utility class on an element, stop and promote the pattern to the theme.

#### File layout

- `app/app.css` — Tailwind v4 entry. Two `@import` lines; do not add rules here.
- `app/theme.css` — the single source of truth:
  - `@font-face` → self-hosted font registrations. Family names must match the `--font-*` tokens.
  - `@theme` → design tokens (colours, font stacks, spacing/scale extensions).
  - `@layer base` → element defaults (`html`, `body`, `h1`–`h6`, `p`, `a`, `img`, form controls, `code`, `pre`, focus ring).
  - `@layer components` → named reusable patterns (`.page-shell`, `.hero-wordmark`, `.tagline`, `.brand-mark`, `.stack-trace`, …).

#### The styling hierarchy (strict order)

When you need to style something, work down this list and stop at the first level that fits:

1. **Element default (`@layer base` in `theme.css`).** If every `h2` on the site should look the same, style `h2` directly — no class in TSX.
2. **Component class (`@layer components` in `theme.css`).** If a pattern repeats or needs a variant (`.page-shell`, `.page-shell--tight`), define it once and reference it by name. Use BEM-style modifiers (`.name--variant`) rather than utility stacks.
3. **Tailwind utility on the element.** Escape hatch only. Requires a code comment on the line above explaining why the pattern isn't promoted to the theme.

#### Hard rules

- **Never** hardcode a colour, font, size, or spacing literal in TSX (`className="text-[#b31761]"`, `style={{ marginTop: 12 }}`). Extend `@theme` tokens instead.
- **Never** use arbitrary Tailwind values (`w-[137px]`, `text-[13px]`) in TSX. If you need a new size, add it as a token or component class.
- **Never** stack more than one Tailwind utility on a single element in TSX without a justifying comment. Two utilities = you owe the theme a new component class.
- **Never** re-declare tokens, `@font-face` blocks, or element defaults in `app.css` or route files.
- `className` values in route TSX should be a single component-class token (`className="page-shell"`) or absent entirely. A grep for `className="` in `app/` is a quick health check.

#### Recipes

**Add a new colour or font.** Edit the `@theme` block in `theme.css`. Tailwind auto-generates `bg-*`, `text-*`, `border-*`, `font-*` utilities from it — but you should still consume the token through a base rule or component class, not a utility in TSX.

**Change how all `h1`s look.** Edit the `h1` rule in `@layer base` in `theme.css`. Do not add per-page overrides.

**Introduce a new page layout.** Add a component class in `@layer components` (`.page-shell-*`, `.section-*`) and reference it from the route with a single `className`.

**One-off exception.** Add the utility in TSX with a comment: `{/* one-off: RFP mock-up only, remove after launch */}`.

#### Migration checklist for new work

- [ ] Route TSX contains no colour, spacing, or typography utilities.
- [ ] Every `className` in `app/routes/**` is a single component-class name or empty.
- [ ] New tokens landed in `theme.css` `@theme`, not inline.
- [ ] New shared patterns landed in `@layer components`, not inline.

#### Aesthetic principles

- Designs should be simple. Favour whitespace, contrast, and hierarchy over decoration.
- **Responsive-first:** every component must work at `sm`, `md`, `lg`, and `xl` breakpoints. Test at 375 px and 1440 px minimum. Responsive rules belong in `theme.css` (media queries inside base or component layers), not in TSX.

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
