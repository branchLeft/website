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
 */
export default {
  ssr: true,
} satisfies Config;
