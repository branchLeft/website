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

test('accordion feature groups can be opened and closed', async ({ page }) => {
  await page.goto('/solutions/affordable-websites');

  // Get the Design & Development accordion (should be open by default)
  const designAccordion = page.locator('details[data-accent="design"]');
  const qualityAccordion = page.locator('details[data-accent="quality"]');

  // Verify initially open accordion
  await expect(designAccordion).toHaveAttribute('open', '');

  // Click to close it
  await designAccordion.locator('summary').click();
  await expect(designAccordion).not.toHaveAttribute('open', '');

  // Click to open a closed accordion
  await qualityAccordion.locator('summary').click();
  await expect(qualityAccordion).toHaveAttribute('open', '');

  // Click to close it
  await qualityAccordion.locator('summary').click();
  await expect(qualityAccordion).not.toHaveAttribute('open', '');
});
