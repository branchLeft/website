import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('renders and passes a11y', async ({ page }) => {
  await page.goto('/publicpress');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await checkA11y(page);
});

test('the learn more button links to publicpress.co.uk', async ({ page }) => {
  await page.goto('/publicpress');
  await expect(page.getByRole('link', { name: 'learn more' })).toHaveAttribute(
    'href',
    'https://publicpress.co.uk/'
  );
});

test('ends with the other two avenues', async ({ page }) => {
  await page.goto('/publicpress');
  const next = page.locator('.next-steps');
  await expect(next.getByRole('link')).toHaveCount(2);
  await next.getByRole('link', { name: /Bespoke Solutions/ }).click();
  await expect(page).toHaveURL('/bespoke');
});

test('the heading is the PublicPress name with the mark inline', async ({ page }) => {
  await page.goto('/publicpress');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText('PublicPress');
  await expect(heading.locator('.publicpress-title__mark svg')).toBeVisible();
});
