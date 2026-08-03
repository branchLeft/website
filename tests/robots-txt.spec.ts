import { expect, test } from '@playwright/test';

// Static file (public/robots.txt), not a route module — served directly via
// the framework's static asset handling, same as public/fonts/**. No DOM,
// so no checkA11y() here (see logo-svg.spec.ts/sitemap-xml.spec.ts for the
// same rationale on the other non-HTML routes).
test('is served and points crawlers at the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);

  const body = await response.text();
  expect(body).toContain('User-agent: *');
  expect(body).toContain('Allow: /');
  expect(body).toContain('Sitemap: https://branchleft.co.uk/sitemap.xml');
});
