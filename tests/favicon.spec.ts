import { expect, test } from '@playwright/test';

// Static assets served from public/ — the PNG favicon fallback and web
// manifest referenced from app/root.tsx's `links` export, alongside the
// primary SVG favicon covered separately in logo-svg.spec.ts.
test.describe('favicon fallback and manifest', () => {
  for (const path of ['/favicon-32.png', '/apple-touch-icon.png']) {
    test(`${path} is served as a real PNG`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    });
  }

  test('manifest.webmanifest is served and parses with the expected fields', async ({
    request,
  }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('branchLeft');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
