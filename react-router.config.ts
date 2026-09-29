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
 *   causes: prerendered pages would ship with no CSP/HSTS/X-Frame-Options
 *   (and contact.tsx's anti-bot check would silently break). See
 *   KNOWN_ISSUES.md for the full explanation and the fix path.
 */
export default {
  ssr: true,
  // React Router refuses an action whose `Origin` differs from the request
  // URL's origin. Behind the TLS-terminating edge the server sees
  // `http://branchleft.co.uk` while browsers send `https://branchleft.co.uk`,
  // so every JavaScript form submission (a fetch to `<route>.data`) was
  // refused with a 400. Only the site's own host is allowed; `www.`
  // redirects to it before any form renders.
  allowedActionOrigins: ['branchleft.co.uk'],
} satisfies Config;
