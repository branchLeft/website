import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('renders and passes a11y', async ({ page }) => {
  await page.goto('/solutions/affordable-websites');
  await expect(page.getByRole('heading', { level: 1, name: 'Affordable Websites' })).toBeVisible();
  await checkA11y(page);
});

test('the back link returns to the about page solutions section', async ({ page }) => {
  await page.goto('/solutions/affordable-websites');
  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page).toHaveURL('/about#solutions');
});
