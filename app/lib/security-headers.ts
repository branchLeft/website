/**
 * Security response headers, shared by root.tsx (headers(), no nonce yet) and
 * entry.server.tsx (adds the per-request nonce CSP). See entry.server.tsx.
 */

/**
 * `style-src 'unsafe-inline'` is a scoped compromise for framer-motion's inline
 * styles (see app/styles/no-js.css); inline styles cannot run script.
 */
const STYLE_SRC = "'self' 'unsafe-inline'";

/**
 * Nonce is base64 or URL-safe, so no quote, semicolon or space can end it.
 * 22 characters is the unpadded length of 16 random bytes.
 */
const NONCE_PATTERN = /^[A-Za-z0-9+/_-]{22,128}={0,2}$/;

/**
 * `isSecure` defaults to true. Only entry.server.tsx passes it: over plain HTTP,
 * `upgrade-insecure-requests` breaks asset loading (nothing listens on TLS).
 */
export function buildContentSecurityPolicy(nonce?: string, isSecure = true): string {
  if (nonce !== undefined && (typeof nonce !== 'string' || !NONCE_PATTERN.test(nonce))) {
    // Fail closed: an invalid nonce is never interpolated into the header.
    throw new TypeError(
      'CSP nonce must be 22 to 128 base64 or URL-safe characters, optionally followed by up to two = padding characters'
    );
  }
  const scriptSrc = nonce !== undefined ? `'self' 'nonce-${nonce}'` : "'self'";
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
 * The static header set, nonce-independent. Applies to every response, via
 * root.tsx's headers() export.
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
