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

export function buildContentSecurityPolicy(nonce?: string): string {
  const scriptSrc = nonce ? `'self' 'nonce-${nonce}'` : "'self'";
  return [
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
    'upgrade-insecure-requests',
  ].join('; ');
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
    // subdomains), no preload — see CLAUDE.md / B19 guidance: HSTS is only
    // safe once HTTPS is confirmed permanent, and preload is a one-way door.
    'Strict-Transport-Security': 'max-age=15552000',
  };
}
