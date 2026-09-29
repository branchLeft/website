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

test('a POST to an unknown path is a 404, not a 405', async ({ request }) => {
  const response = await request.post('/this-page-does-not-exist', { form: { a: '1' } });
  expect(response.status()).toBe(404);
});
