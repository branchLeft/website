import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('renders and passes a11y', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Notice' })).toBeVisible();
  await checkA11y(page);
});
