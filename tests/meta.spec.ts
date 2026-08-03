import { expect, test } from '@playwright/test';

// Spot-checks the shared meta helper (app/lib/meta.ts) end-to-end. The unit
// tests in app/lib/meta.test.ts exercise buildMeta()'s return value in
// isolation; these confirm each route's meta() actually reaches the
// rendered <head> once React Router's <Meta /> renders it.
test.describe('SEO/social metadata', () => {
  test('home page renders a canonical link and Open Graph/Twitter tags', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://branchleft.co.uk/'
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'branchLeft'
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://branchleft.co.uk/'
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
  });

  test("about page's canonical link matches its own path, not the homepage", async ({ page }) => {
    await page.goto('/about');

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://branchleft.co.uk/about'
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://branchleft.co.uk/about'
    );
  });

  test('the 404 page is marked noindex and carries no canonical link', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test('renders Organization JSON-LD with no CSP violation', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto('/');

    const scriptContent = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(scriptContent).not.toBeNull();
    const jsonLd = JSON.parse(scriptContent ?? '{}');
    expect(jsonLd['@type']).toBe('Organization');
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd.name).toBe('branchLeft');
    expect(Array.isArray(jsonLd.sameAs)).toBe(true);
    expect(jsonLd.sameAs.length).toBeGreaterThan(0);

    const cspViolations = consoleErrors.filter((message) =>
      /content security policy|refused to execute/i.test(message)
    );
    expect(cspViolations).toEqual([]);
  });
});
