import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('renders the hero and passes a11y', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'branchLeft' })).toBeVisible();
  await checkA11y(page);
});

test('the learn more CTA navigates to the about page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'learn more' }).click();
  await expect(page).toHaveURL('/about');
});
