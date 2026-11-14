import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('renders the hero and passes a11y', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'branchLeft' })).toBeVisible();
  await checkA11y(page);
});

for (const avenue of [
  { name: 'Announcing PublicPress', url: '/publicpress' },
  { name: 'About branchLeft', url: '/about' },
  { name: 'Bespoke Solutions', url: '/bespoke' },
]) {
  test(`the ${avenue.name} card navigates to ${avenue.url}`, async ({ page }) => {
    await page.goto('/');
    await page
      .locator('main')
      .getByRole('link', { name: new RegExp(avenue.name) })
      .click();
    await expect(page).toHaveURL(avenue.url);
  });
}

test('the PublicPress card carries the PublicPress mark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-avenue="publicpress"] .avenue__mark svg')).toBeVisible();
});
