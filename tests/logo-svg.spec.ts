import { expect, test } from '@playwright/test';

// Resource route (app/routes/logo-svg.tsx): a raw SVG, not an HTML document,
// so there is no DOM for checkA11y(). This confirms the favicon is reachable
// and well-formed.
test('is served as a valid, cacheable SVG', async ({ request }) => {
  const response = await request.get('/logo.svg');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  expect(response.headers()['cache-control']).toContain('immutable');

  const body = await response.text();
  expect(body.trim().startsWith('<svg')).toBe(true);
});
