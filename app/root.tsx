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
  { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
];

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
