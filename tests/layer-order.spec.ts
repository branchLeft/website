import { expect, test } from '@playwright/test';
import { setStoredTheme } from './theme';

const ROUTES = [
  '/',
  '/publicpress',
  '/about',
  '/bespoke',
  '/contact',
  '/privacy',
  '/terms',
  '/this-page-does-not-exist',
];

// The hero is an <h1>, and the site's `h1` rule (in `base`) would otherwise
// set it in the heading face at heading size. Its own rules (the brand's
// `.bl-wordmark` and the home page's `.home-hero__text h1`, both in
// `components`) must beat it. See app/app.css.
const HERO = '.home-hero h1.bl-wordmark';

for (const { width, size } of [
  { width: 600, size: '60px' },
  { width: 1440, size: '96px' },
]) {
  test(`the home hero wordmark renders in Syne 500 at ${size} (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const hero = page.locator(HERO);
    await expect(hero).toHaveCSS('font-size', size);
    await expect(hero).toHaveCSS('line-height', size);
    await expect(hero).toHaveCSS('font-weight', '500');
    await expect(hero).toHaveCSS('font-family', /Syne/);
  });
}

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

test('on a 320px phone the hero steps down to 48px and keeps the page padding', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  const hero = page.locator(HERO);
  await expect(hero).toHaveCSS('font-size', '48px');

  const gaps = await hero.evaluate((h) => {
    const range = document.createRange();
    range.selectNodeContents(h);
    const text = range.getBoundingClientRect();
    return { left: text.left, right: window.innerWidth - text.right };
  });
  expect(gaps.left).toBeGreaterThanOrEqual(24);
  expect(gaps.right).toBeGreaterThanOrEqual(24);
});

test('below 320px the page keeps its 320px layout instead of squeezing', async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 700 });
  for (const route of ['/', '/about', '/contact']) {
    await page.goto(route);
    const width = await page.evaluate(() => document.documentElement.getBoundingClientRect().width);
    expect(width, route).toBe(320);
  }
});
