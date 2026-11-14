import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('renders and passes a11y', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await checkA11y(page);
});

test('ends with the other two avenues', async ({ page }) => {
  await page.goto('/about');
  const next = page.locator('.next-steps');
  await expect(next.getByRole('link')).toHaveCount(2);
  await next.getByRole('link', { name: /Announcing PublicPress/ }).click();
  await expect(page).toHaveURL('/publicpress');
});
