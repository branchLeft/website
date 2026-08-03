import * as React from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router';
import type { Route } from './+types/root';
import './app.css';
import noJsStylesHref from './styles/no-js.css?url';
import { PageTransition } from '@branchleft/components';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { buildSecurityHeaders } from './lib/security-headers';

export const links: Route.LinksFunction = () => [
  // SVG favicon first — modern browsers prefer it. The PNG/manifest entries
  // below are fallbacks for contexts that don't support SVG favicons (older
  // Safari, PWA install surfaces).
  { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
  { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
  { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  // theme_color/background_color in manifest.webmanifest are hardcoded to
  // match --color-bg (a JSON file can't reference a CSS custom property) —
  // keep them in sync if that token ever changes.
  { rel: 'manifest', href: '/manifest.webmanifest' },
  // Preload the two families used in the site-wide nav bar (brand wordmark +
  // nav labels), rendered above the fold on every route. The other two
  // families (heading/body) vary by route, so they're left to font-display:
  // swap rather than preloaded on every page.
  {
    rel: 'preload',
    as: 'font',
    type: 'font/woff2',
    href: '/fonts/Syne/Syne-VariableFont_wght.woff2',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    as: 'font',
    type: 'font/woff2',
    href: '/fonts/RobotoMono/RobotoMono-VariableFont_wght.woff2',
    crossOrigin: 'anonymous',
  },
];

// Fallback title/description for any request that matches no route (e.g. a
// 404) and so never reaches a leaf route's own meta(). React Router's <Meta/>
// lets the deepest matched route's meta win for shared keys like `title`, so
// this has no effect on ordinary pages — each still renders only its own
// leaf-level title.
export function meta() {
  return [
    { title: 'Page not found — branchLeft' },
    { name: 'description', content: 'Page not found.' },
    // Not routed through buildMeta() (app/lib/meta.ts): a canonical URL and
    // OG/Twitter card don't make sense for a response with no real page
    // behind it. noindex instead, so a 404 never gets indexed under
    // whatever URL produced it.
    { name: 'robots', content: 'noindex' },
  ];
}

/**
 * Root-level `headers()` is inherited by every route that doesn't export its
 * own `headers()` (React Router v7 merges from root down to the matched leaf;
 * a leaf with no `headers()` export falls back to its parent's — see
 * `getDocumentHeadersImpl` in react-router's server runtime). No route in
 * this app currently exports `headers()`, so this set applies site-wide,
 * including resource routes like `/logo.svg`.
 *
 * `Content-Security-Policy` is built without a nonce here — this function
 * runs during route matching, before rendering, so no nonce exists yet.
 * `app/entry.server.tsx` generates the real per-request nonce and overrides
 * this header for HTML document responses; this CSP (script-src 'self', no
 * nonce) is only what a response would carry if it bypassed entry.server.tsx
 * entirely (i.e. resource routes, which render no <Scripts /> and so need
 * no nonce).
 */
export const headers: Route.HeadersFunction = () => buildSecurityHeaders();

export function Layout({ children }: { readonly children: React.JSX.Element }): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Only fetched/applied when scripting is disabled — see no-js.css header comment */}
        <noscript>
          <link rel="stylesheet" href={noJsStylesHref} />
        </noscript>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <div className="app-layout">
      <NavBar />
      <PageTransition key={location.pathname}>
        <Outlet />
      </PageTransition>
      <Footer />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="page-shell page-shell--tight">
      <h1>{message}</h1>
      <p className="tagline">{details}</p>
      {stack && (
        <pre className="stack-trace">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
