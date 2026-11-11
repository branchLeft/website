import type { Config } from '@react-router/dev/config';

/**
 * Framework Mode, SSR on, routes in app/routes.ts, no SPA mode.
 * Pre-rendering is off: prerendered pages lack CSP, HSTS and X-Frame-Options.
 */
export default {
  ssr: true,
  // Behind the TLS edge the server sees http:// while browsers send https://,
  // so React Router refused every JS form submission with a 400. Only the
  // site's own host is allowed; www. redirects to it first.
  allowedActionOrigins: ['branchleft.co.uk'],
} satisfies Config;
