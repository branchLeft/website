import type { Config } from '@react-router/dev/config';

/**
 * Framework Mode with SSR always on, manual routes in `app/routes.ts`, no SPA
 * mode: the committed decisions are in website/CLAUDE.md, "Routing Strategy".
 *
 * Pre-rendering is off. To opt a route in, add `prerender: ['/path']` (see
 * node_modules/react-router/docs/how-to/pre-rendering.md), but not before
 * fixing what it breaks: prerendered pages ship with no CSP, HSTS or
 * X-Frame-Options, and contact.tsx's anti-bot check fails silently. See
 * KNOWN_ISSUES.md.
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
