import { expect, test } from '@playwright/test';

// Resource route (app/routes/logo-svg.tsx) — returns a raw SVG response, not
// an HTML document, so there's no DOM for checkA11y() to inspect here; a11y
// coverage for the rendered <Logo /> markup lives with the pages that embed
// it (e.g. home.spec.ts, nav.spec.ts). This just confirms the favicon
// resource itself is reachable and well-formed.
test('is served as a valid, cacheable SVG', async ({ request }) => {
  const response = await request.get('/logo.svg');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  expect(response.headers()['cache-control']).toContain('immutable');

  const body = await response.text();
  expect(body.trim().startsWith('<svg')).toBe(true);
});
