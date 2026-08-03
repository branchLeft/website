import type { Config } from '@react-router/dev/config';

/**
 * Routing strategy: React Router v7 Framework Mode + SSR
 *
 * Committed decisions:
 *   - Framework Mode via `@react-router/dev` and the `reactRouter()` Vite plugin.
 *     This is the most expressive mode: route modules, generated types, server/client
 *     loaders/actions, middleware, and a clear upgrade path to RSC.
 *   - SSR is always on (`ssr: true`). Do not disable it.
 *   - Route config: manual `app/routes.ts` using `route()`, `index()`, `layout()`,
 *     and `prefix()` helpers from `@react-router/dev/routes`. No file-system routing.
 *   - SPA mode (`ssr: false`) is prohibited.
 *
 * Pre-rendering (not yet active):
 *   When a route has no dynamic data and should be served as a static HTML file,
 *   opt it in via the `prerender` array below. Pre-rendered routes still hydrate
 *   fully on the client and still benefit from server loaders at build time.
 *
 *   Example:
 *     prerender: ['/', '/about'],
 *
 *   Or use a function to generate paths dynamically at build time:
 *     async prerender({ getStaticPaths }) { return getStaticPaths(); },
 *
 *   See: node_modules/react-router/docs/how-to/pre-rendering.md
 *
 *   DO NOT enable this without first fixing a real problem it currently
 *   causes: `@react-router/serve`'s server (see its `cli.js`) registers
 *   `express.static` for both `build/client` (where prerendered `.html`
 *   files land) and `public/`, and both run *before* the SSR catch-all
 *   handler that applies `root.tsx`'s `headers()` export and
 *   `entry.server.tsx`'s per-request CSP nonce. A prerendered page would
 *   therefore ship in production with no CSP, no HSTS, no X-Frame-Options,
 *   etc. — express.static serves the static file and the request never
 *   reaches the code that sets those headers. There's a second, independent
 *   problem too: a nonce baked into a prerendered page at build time is
 *   fixed forever, which defeats nonce-based CSP regardless. Separately,
 *   `contact.tsx`'s loader stamps `renderedAt: Date.now()` for its
 *   anti-bot minimum-time-on-page check — that route must never be
 *   prerendered even if the header issue above is solved, since freezing
 *   `renderedAt` at build time would silently defeat that check for the
 *   life of the deployed build. Fixing this needs its own design (e.g.
 *   LB-level header injection via infra/edge.ts's URL map `HeaderAction`,
 *   or an Express wrapper reapplying buildSecurityHeaders()/nonce-rewriting
 *   to static files) — not a drive-by config change.
 */
export default {
  ssr: true,
} satisfies Config;
