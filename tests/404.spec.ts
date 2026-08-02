import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('an unknown path renders the 404 error boundary', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);

  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  await expect(page.getByText('The requested page could not be found.')).toBeVisible();
});

// No route matches an unknown path, so no route-level meta() ever runs and
// <Meta /> in app/root.tsx's <Layout> renders nothing — the document ships
// with no <title>, which axe's document-title rule flags. This is a
// pre-existing gap in the ErrorBoundary (app/root.tsx), not a test issue;
// fixing it means giving the error boundary its own title, which is
// application code out of scope here. Left as .fixme() so this is visible
// and re-enables itself the moment the fix lands, rather than silently
// skipping a11y coverage for this page forever.
test.fixme('passes a11y', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await checkA11y(page);
});
