import { expect, test } from '@playwright/test';
import { THEME_COOKIE_NAME } from '@branchleft/components';
import { checkA11y } from './a11y';
import { openEverything, setStoredTheme, showContactError } from './theme';

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

test('dark is the default, and does not follow the OS colour scheme', async ({ browser }) => {
  // A fresh context with no cookie and an OS preference set to light — if
  // the site followed prefers-color-scheme this would render light.
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});

test('the switch changes theme instantly, names its action, and survives a reload', async ({
  page,
}) => {
  await page.goto('/about');
  const html = page.locator('html');

  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();

  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === THEME_COOKIE_NAME)?.value).toBe('light');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('the switch has a visible focus ring in both modes', async ({ page }) => {
  await page.goto('/');
  const toLight = page.getByRole('button', { name: 'Switch to light mode' });
  await toLight.focus();
  await expect(toLight).toHaveCSS('outline-style', 'solid');

  await setStoredTheme(page, 'light');
  const toDark = page.getByRole('button', { name: 'Switch to dark mode' });
  await toDark.focus();
  await expect(toDark).toHaveCSS('outline-style', 'solid');
});

test('no flash of dark when light is the stored choice', async ({ page }) => {
  await page.goto('/');
  await setStoredTheme(page, 'light');

  // The raw server response, before any script runs: it must already carry
  // the stored choice. `page.request` sends the context's cookies.
  const html = await (await page.request.get('/about')).text();
  expect(html).toMatch(/<html[^>]*data-theme="light"/);
});

for (const theme of ['dark', 'light'] as const) {
  test(`every route passes axe in ${theme} mode, with every disclosure open`, async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await setStoredTheme(page, theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await checkA11y(page);
      await openEverything(page);
      await checkA11y(page);
    }
  });

  test(`the contact form's error state passes axe in ${theme} mode`, async ({ page }) => {
    await page.goto('/contact');
    await setStoredTheme(page, theme);
    await showContactError(page);
    await checkA11y(page);
  });
}
