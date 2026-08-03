import { expect, test } from '@playwright/test';

// Static asset served from public/ — confirms the share image referenced by
// og:image/twitter:image (app/lib/meta.ts) actually resolves, rather than
// 404ing on every shared link.
test('og-image.png is served as a real, non-empty PNG', async ({ request }) => {
  const response = await request.get('/og-image.png');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');

  const body = await response.body();
  expect(body.length).toBeGreaterThan(0);
});
