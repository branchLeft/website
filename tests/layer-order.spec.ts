import { expect, test } from '@playwright/test';
import { setStoredTheme } from './theme';

const ROUTES = [
  '/',
  '/about',
  '/solutions/local-news',
  '/solutions/affordable-websites',
  '/contact',
  '/privacy',
  '/terms',
  '/this-page-does-not-exist',
];

// The brand stylesheet's classes must beat the site's own element rules:
// the hero is an <h1>, and the site's `h1` rule (in `base`) would otherwise
// set it in the heading face at heading size. See app/app.css.
test('the home hero wordmark renders in Syne 500 at 60px', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('h1.bl-wordmark--hero');
  await expect(hero).toHaveCSS('font-size', '60px');
  await expect(hero).toHaveCSS('line-height', '60px');
  await expect(hero).toHaveCSS('font-weight', '500');
  await expect(hero).toHaveCSS('font-family', /Syne/);
});

// ...while the site's own element rules still beat the brand's defaults.
test("the site's own h1 rule beats the brand stylesheet's element default", async ({ page }) => {
  await page.goto('/about');
  const h1 = page.locator('main h1').first();
  await expect(h1).toHaveCSS('font-size', '36px');
  // 40px is the site's text-4xl; the brand default would give 39.6px.
  await expect(h1).toHaveCSS('line-height', '40px');
});

for (const width of [320, 375, 390]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const theme of ['dark', 'light'] as const) {
      test(`no route scrolls sideways, and the nav controls fit (${theme})`, async ({ page }) => {
        for (const route of ROUTES) {
          await page.goto(route);
          if (theme === 'light') await setStoredTheme(page, 'light');

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth
          );
          expect(overflow, `${route} overflows by ${overflow}px`).toBeLessThanOrEqual(0);

          // The 404 page is the root error boundary, which renders no nav.
          if (route === '/this-page-does-not-exist') continue;
          for (const control of [
            page.locator('.site-nav__toggle'),
            page.locator('.site-nav__theme-toggle button'),
          ]) {
            const box = await control.boundingBox();
            expect(box, `${route}: control not rendered`).not.toBeNull();
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          }
        }
      });
    }
  });
}
