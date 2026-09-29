/**
 * Security response headers, shared between `root.tsx` (`headers()` export,
 * runs before rendering — no nonce available yet) and `entry.server.tsx`
 * (runs during rendering — generates the per-request nonce and overrides
 * the `Content-Security-Policy` header with the nonce-bearing version).
 *
 * See `app/entry.server.tsx` for why the nonce can't be produced here.
 */

/**
 * `style-src 'unsafe-inline'` is a deliberate, scoped compromise: framer-motion
 * (via `PageTransition` in root.tsx, and `SolutionsShowcase`) sets inline
 * `style=""` attributes for its animated initial state, SSR'd on every route
 * — see the comment block in `app/styles/no-js.css` for why that SSR'd inline
 * style exists and must not be removed. Inline styles can't execute script,
 * so this doesn't weaken the policy's protection against XSS; only
 * `script-src` (nonce-gated, no 'unsafe-inline') matters for that.
 */
const STYLE_SRC = "'self' 'unsafe-inline'";

/**
 * `isSecure` defaults to `true` (production's normal case) since most
 * callers have no way to know the actual request's scheme — see
 * `app/entry.server.tsx`, the one caller that does, for why it matters:
 * `upgrade-insecure-requests` is a live, per-response instruction (unlike
 * `Strict-Transport-Security`, it doesn't need a prior secure connection or
 * any browser-side cache to take effect) that force-upgrades every
 * same-page subresource request to HTTPS — including on a plain-HTTP
 * request, which breaks asset loading entirely against a server with no
 * TLS listener (`pnpm start`, the e2e test server).
 */
export function buildContentSecurityPolicy(nonce?: string, isSecure = true): string {
  const scriptSrc = nonce ? `'self' 'nonce-${nonce}'` : "'self'";
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${STYLE_SRC}`,
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ];
  if (isSecure) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=()',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'picture-in-picture=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'usb=()',
  'xr-spatial-tracking=()',
].join(', ');

/**
 * The static (nonce-independent) header set. Applies to every response —
 * document requests and resource routes (e.g. `/logo.svg`) alike — via
 * root.tsx's `headers()` export.
 */
export function buildSecurityHeaders(nonce?: string): Record<string, string> {
  return {
    'Content-Security-Policy': buildContentSecurityPolicy(nonce),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': PERMISSIONS_POLICY,
    // Conservative max-age (~180 days), no includeSubDomains (unvetted
    // subdomains), no preload: HSTS is only safe to widen once HTTPS is
    // confirmed permanent, and preload submission is a one-way door.
    'Strict-Transport-Security': 'max-age=15552000',
  };
}
