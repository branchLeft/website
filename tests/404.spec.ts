import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('an unknown path renders the 404 error boundary', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);

  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  await expect(page.getByText('The requested page could not be found.')).toBeVisible();
});

test('passes a11y', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await checkA11y(page);
});
