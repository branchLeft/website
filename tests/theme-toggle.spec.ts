import { expect, test } from '@playwright/test';
import { THEME_STORAGE_KEY } from '@branchleft/components';
import { checkA11y } from './a11y';
import { setStoredTheme } from './theme';

test('dark is the default, and does not follow the OS colour scheme', async ({ browser }) => {
  // A fresh context with no stored choice and an OS preference set to light —
  // if the site followed prefers-color-scheme this would render light.
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
  await context.close();
});

test('the toggle switches data-theme on <html> and persists across a reload', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const toggle = page.getByRole('button', { name: 'Toggle colour theme' });

  await expect(html).not.toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: 'Toggle colour theme' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
});

test('the toggle has a visible focus ring in both modes', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle colour theme' });
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveCSS('outline-style', 'solid');

  await setStoredTheme(page, 'light');
  await page.getByRole('button', { name: 'Toggle colour theme' }).focus();
  await expect(page.getByRole('button', { name: 'Toggle colour theme' })).toHaveCSS(
    'outline-style',
    'solid'
  );
});

test('no flash of dark on reload when light is the stored choice', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((key) => window.localStorage.setItem(key, 'light'), THEME_STORAGE_KEY);

  // domcontentloaded fires once the parser reaches the end of the document,
  // by which point the inline theme-init script (the very first thing in
  // <head> — see root.tsx) has already run, but well before hydration.
  // Reading data-theme at this point catches a flash any later assertion
  // (which would wait for full load / React hydration) could miss.
  await page.reload({ waitUntil: 'domcontentloaded' });
  const themeAtDomContentLoaded = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme')
  );
  expect(themeAtDomContentLoaded).toBe('light');
});

test('every route passes axe in light mode', async ({ page }) => {
  const routes = [
    '/',
    '/about',
    '/solutions/local-news',
    '/solutions/affordable-websites',
    '/contact',
    '/privacy',
    '/terms',
    '/this-page-does-not-exist',
  ];
  for (const route of routes) {
    await page.goto(route);
    await setStoredTheme(page, 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await checkA11y(page);
  }
});
