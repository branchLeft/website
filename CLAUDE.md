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

## Node Version

This repo has an `.nvmrc`. Always run `nvm use` before any commands to activate the correct Node version. Do not hardcode version paths or manipulate `$PATH` manually.

```bash
nvm use
```

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

### Legal Pages (`/privacy`, `/terms`)

These routes are a documented exception to the "never write prose" rule above: they contain standard UK GDPR / ICO / template boilerplate written verbatim rather than as tokens. If future owner-input values arise (e.g. a new ICO registration number, a change of registered office, a new effective date), tokenise them via a local `<T>` component and render with the `.legal-page__token` style so unresolved values are obviously synthetic in the DOM. Both pages are currently fully resolved — no `<T>` tokens remain.

**Canonical sources**

- Privacy notice: adapted from the ICO "Create your own privacy notice" tool — <https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/create-your-own-privacy-notice/>.
- Terms of use: owner-reviewed template. The site is informational only with no client-relationship created by browsing or form submission; a formal solicitor review was judged unnecessary.

**What triggers a re-review of these pages**

Update the relevant route file AND the corresponding note in this section whenever any of the following change:

- New data-processing purpose (e.g. adding analytics, cookies, newsletter, careers/recruitment, online payments)
- New third-party processor (e.g. form backend, email marketing, error tracking, CDN)
- New international data transfer or change of hosting region
- Change in company details (registration number, registered office, ICO registration)
- Change in retention periods or complaint routing
- Any change to services, liability posture, IP ownership, or governing law

**Contact form**

- `/contact` submits via a route `action` in `app/routes/contact.tsx`, which calls `sendContactEmail` (`app/lib/sendContactEmail.server.ts`) over Gmail SMTP as `info@branchleft.co.uk` — the mailbox already disclosed as a processor above, so no separate third-party entry is needed.
- Requires `GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables (see `.env.example`). Not committed; set as real env vars/secrets on the hosting platform in production.

### Styling

**All visual decisions live in `app/styles/` — nowhere else.** Route TSX must stay as close to bare semantic markup as possible. If you find yourself typing more than one utility class on an element, stop and promote the pattern to the theme.

#### File layout

- `app/app.css` — Tailwind v4 entry. Two `@import` lines; do not add rules here.
- `app/styles/theme.css` — entry point for the split styling system. Imports in order:
  - `fonts.css` → `@font-face` declarations. Family names must match the `--font-*` tokens.
  - `base.css` → `@layer base` element defaults (`html`, `body`, `h1`–`h6`, `p`, `a`, `img`, form controls, `code`, `pre`, focus ring).
  - `primitives.css` → `@layer components` cross-page utilities.
  - `components/*.css` — component-specific patterns: `site-nav.css`, `page-transition.css`, `section-nav.css`, `section-heading.css`, `bio.css`, `back-link.css`, `call-to-action.css`, `values-cloud.css`, `solutions-showcase.css`, `site-footer.css`.
  - `pages/*.css` — page-specific overrides: `home.css`, `about.css`, `contact.css`, `article.css`, `legal.css`.
  - **Import order is authoritative for cascade** — later files override earlier ones.
- `app/styles/no-js.css` — **not imported** in the main bundle. Loaded only via `<noscript><link>` in `root.tsx` to provide fallback styling for users with JavaScript disabled. See file header for what it overrides.

#### The styling hierarchy (strict order)

When you need to style something, work down this list and stop at the first level that fits:

1. **Element default (`@layer base` in `app/styles/`).** If every `h2` on the site should look the same, style `h2` directly — no class in TSX.
2. **Component class (`@layer components` in `app/styles/`).** If a pattern repeats or needs a variant (`.page-shell`, `.page-shell--tight`), define it once and reference it by name. Use BEM-style modifiers (`.name--variant`) rather than utility stacks.
3. **Tailwind utility on the element.** Escape hatch only. Requires a code comment on the line above explaining why the pattern isn't promoted to the theme.

#### Hard rules

- **Never** hardcode a colour, font, size, or spacing literal in TSX (`className="text-[#b31761]"`, `style={{ marginTop: 12 }}`). Extend `@theme` tokens instead.
- **Never** use arbitrary Tailwind values (`w-[137px]`, `text-[13px]`) in TSX. If you need a new size, add it as a token or component class.
- **Never** stack more than one Tailwind utility on a single element in TSX without a justifying comment. Two utilities = you owe the theme a new component class.
- **Never** re-declare tokens, `@font-face` blocks, or element defaults in `app.css` or route files.
- **Never** duplicate a Tailwind token as a raw literal in `app/styles/` (`font-size: 1.125rem; /* text-lg */`). Use `@apply text-lg;` so the scale stays single-sourced in Tailwind's theme. Only fall back to raw CSS when no utility maps cleanly (`color-mix()`, `letter-spacing`, custom `--font-*` families, one-off `text-[10px]`).
- `className` values in route TSX should be a single component-class token (`className="page-shell"`) or absent entirely. A grep for `className="` in `app/` is a quick health check.

#### Recipes

**Add a new colour or font.** Edit the `@theme` block in `app/styles/theme.css`. Tailwind auto-generates `bg-*`, `text-*`, `border-*`, `font-*` utilities from it — but you should still consume the token through a base rule or component class, not a utility in TSX.

**Change how all `h1`s look.** Edit the `h1` rule in `@layer base` in `app/styles/base.css`. Do not add per-page overrides.

**Introduce a new page layout.** Add a component class in `@layer components` (`.page-shell-*`, `.section-*`) and reference it from the route with a single `className`.

**One-off exception.** Add the utility in TSX with a comment: `{/* one-off: RFP mock-up only, remove after launch */}`.

**Reach for a Tailwind value inside `theme.css`.** Use `@apply <utility>` — never copy the raw rem/px value. Example:

```css
/* GOOD — token stays single-sourced */
.hero-wordmark {
  @apply text-6xl;
  font-family: var(--font-wordmark);
}

/* BAD — hardcoded literal with a Tailwind comment */
.hero-wordmark {
  font-size: 3.75rem; /* text-6xl */
  font-family: var(--font-wordmark);
}
```

VS Code's built-in CSS validator does not recognise `@apply`/`@theme`/`@layer`. The workspace `.vscode/settings.json` silences the "unknown at-rule" warning; install the Tailwind CSS IntelliSense extension for hover/autocomplete on utility names.

#### Migration checklist for new work

- [ ] Route TSX contains no colour, spacing, or typography utilities.
- [ ] Every `className` in `app/routes/**` is a single component-class name or empty.
- [ ] New tokens landed in `theme.css` `@theme`, not inline.
- [ ] New shared patterns landed in `@layer components`, not inline.
- [ ] Any Tailwind-scale value in `theme.css` is written as `@apply <utility>`, not a hardcoded rem literal.

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
