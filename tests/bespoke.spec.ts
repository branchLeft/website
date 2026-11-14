import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('renders and passes a11y', async ({ page }) => {
  await page.goto('/bespoke');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await checkA11y(page);
});

test('the main call to action opens the contact form on the bespoke category', async ({ page }) => {
  await page.goto('/bespoke');
  await page.getByRole('link', { name: 'tell us more' }).click();
  await expect(page).toHaveURL('/contact?category=bespoke-technology');
});

test('the affordable websites section is addressable', async ({ page }) => {
  await page.goto('/bespoke#affordable-websites');
  await expect(page.getByRole('heading', { level: 2, name: 'Affordable Websites' })).toBeVisible();
});
