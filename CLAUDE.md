**Bias for action.** Delivering something and failing fast leads to better progress and informed decision making. Do not agonise theoretically over the exact behaviour of a system which you can observe the behaviour of: run it in the cheapest real place (a test, a check-mode run, the live API, a pre-live host) and decide from what it does. The workspace `AUTHORISATIONS.md` and never-list still apply.

# CLAUDE.md — branchLeft Website

Cross-repo rules (Node/nvm, non-interactive commands, pre-commit, comment style) live in the workspace root `CLAUDE.md`.

React 19, React Router v7 (Framework Mode, SSR), Tailwind CSS v4, Vite 8, pnpm, Playwright with `@axe-core/playwright`.

Commands: `pnpm build`, `pnpm typecheck`, `pnpm test:unit --run`, `pnpm lint`, `pnpm format:check`.

Pre-commit runs prettier through pnpm. Commit with Node 26.5.0 (`.nvmrc`) first on PATH; Node 20 fails with `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`.

## Routing

- Framework Mode with SSR on (`ssr: true`). Do not set `ssr: false`, add SPA mode or introduce RSC APIs.
- Routes are declared in `app/routes.ts` with `route()`, `index()`, `layout()`, `prefix()`. No `flatRoutes`. Each route is one file under `app/routes/` and exports `meta()`.
- Pre-rendering is opt-in: add a route to the `prerender` array in `react-router.config.ts`, only for routes with no dynamic data.

## Infrastructure

Production runs on the Hetzner estate. CI deploys `deploy/compose.yml` to `app1` over SSH, behind the shared Caddy edge on `edge1`. Host bootstrap: `deploy/RUNBOOK-app1-website.md`. Adding a site to the edge: `shared-infra/hetzner/RUNBOOK-edge.md` §11.

The `deploy` job in `.github/workflows/ci.yml` pushes to `ghcr.io/branchleft/website` and pins app1 to the digest with `branchleft-deploy`. A merge to `main` is the production deploy. The pinned reference lives only on the host, in `/etc/branchleft/website.image.env`.

Do not add US hyperscaler resources. This repo has no infrastructure code.

Open: git history holds an `encryptionsalt` from a removed Pulumi stack file. Closing it needs the passphrase and the SMTP credential rotated. Owner actions.

## Content and Copy

- Never write prose or copy on the user's behalf. Use ALL_CAPS placeholder tokens (`HEADING_CONTENT`, `BODY_TEXT`, `CTA_LABEL`, `IMAGE_ALT`) as JSX string literals or comments.
- Exception: `/privacy` and `/terms` carry standard UK GDPR, ICO and template boilerplate verbatim. A new owner-input value is tokenised with a local `<T>` component rendered with `.legal-page__token`.
- Update the route and the privacy notice together when a processing purpose, processor, transfer or hosting region, company detail, retention or complaint route, or any service, liability, IP or governing-law term changes.

## Contact Form

- `/contact` posts to the action in `app/routes/contact.tsx`, which calls `sendContactEmail` (`app/lib/sendContactEmail.server.ts`). It sends over SMTP AUTH submission (587, STARTTLS) on branchLeft's self-hosted mail platform, to `info@branchleft.co.uk`.
- The `CONTACT_SMTP_*` variables (see `.env.example`) are never committed. They are written by hand to `/etc/branchleft/website.env` on `app1` (`deploy/RUNBOOK-app1-website.md` §1). The submission account is send-as-only and separate from the mailbox password.
- A failed send increments a Prometheus counter in `server/metrics.mjs`, served by `server/metrics-server.mjs` on a private port (`deploy/compose.yml`).

## Styling

All visual decisions live in `app/styles/`. Route TSX stays close to bare semantic markup. Import order in `app/styles/theme.css` is the cascade; later files win. Add no rules to `app/app.css`.

Work down this list and stop at the first level that fits:

1. Element default in `@layer base` (style `h2` directly, no class in TSX).
2. Component class in `@layer components`, with BEM modifiers (`.page-shell--tight`).
3. Tailwind utility on the element. Escape hatch only: comment the line above it.

Hard rules:

- No colour, font, size or spacing literal and no arbitrary Tailwind value in TSX (`text-[#b31761]`, `style={{ marginTop: 12 }}`). Extend `@theme` in `theme.css`.
- At most one utility per element in TSX unless commented. `className` in `app/routes/**` is one component-class token or absent.
- Never re-declare tokens, `@font-face` or element defaults outside `app/styles/`.
- In `app/styles/`, use `@apply <utility>` instead of copying a Tailwind value as raw CSS.
- One-off exception: `{/* one-off: <reason>, remove after <when> */}` above the utility.
- Check every component at 375px and 1440px. Responsive rules go in `theme.css`.

## Code and Tests

- TypeScript strict, no `any`. No default exports except route modules and `root.tsx`. Imports are absolute from `app/`.
- Reusable domain-agnostic components belong in `@branchleft/components`; route-specific ones live in `app/components/`.
- Components are accessible: semantic HTML, ARIA where required, keyboard navigable.
- Every route has a Playwright test in `tests/` that runs `checkA11y()` with zero violations and covers one critical interaction where one exists. Accessibility failures block the build.
