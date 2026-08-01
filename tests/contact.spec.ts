import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

// The form action sends a real email via Gmail SMTP (see
// app/lib/sendContactEmail.server.ts), so these tests exercise the category
// pre-selection and manual selection without ever submitting.

test('renders and passes a11y', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('heading', { level: 1, name: 'Contact Us' })).toBeVisible();
  await checkA11y(page);
});

test('a known category query param pre-selects the matching option', async ({ page }) => {
  await page.goto('/contact?category=local-news');
  await expect(page.getByLabel('Category')).toHaveValue('local-news');
});

test('an unknown category query param is ignored', async ({ page }) => {
  await page.goto('/contact?category=not-a-real-category');
  await expect(page.getByLabel('Category')).toHaveValue('');
});

test('a category can be selected manually', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Category').selectOption('affordable-websites');
  await expect(page.getByLabel('Category')).toHaveValue('affordable-websites');
});
