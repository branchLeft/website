import { expect, test } from '@playwright/test';

// Resource route (app/routes/sitemap-xml.tsx) — returns a raw XML response,
// not an HTML document, so there's no DOM for checkA11y() to inspect here,
// same rationale as logo-svg.spec.ts for /logo.svg.
test('is served as a valid sitemap listing every indexable page', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/xml');

  const body = await response.text();
  expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  expect(body).toContain('<loc>https://branchleft.co.uk/</loc>');
  expect(body).toContain('<loc>https://branchleft.co.uk/about</loc>');
  expect(body).toContain('<loc>https://branchleft.co.uk/solutions/local-news</loc>');
  expect(body).toContain('<loc>https://branchleft.co.uk/solutions/affordable-websites</loc>');
  expect(body).toContain('<loc>https://branchleft.co.uk/contact</loc>');
  expect(body).toContain('<loc>https://branchleft.co.uk/privacy</loc>');
  expect(body).toContain('<loc>https://branchleft.co.uk/terms</loc>');
  expect(body).toContain('<lastmod>');
});
