import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test('renders and passes a11y', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await checkA11y(page);
});

test('switching solutions tabs reveals the matching panel and CTA', async ({ page }) => {
  await page.goto('/about');

  const affordableTab = page.getByRole('tab', { name: 'Affordable Websites' });
  await affordableTab.click();
  await expect(affordableTab).toHaveAttribute('aria-selected', 'true');

  const panel = page.getByRole('tabpanel', { name: /Affordable Websites/ });
  await expect(panel.getByRole('link', { name: /learn more/ })).toHaveAttribute(
    'href',
    '/solutions/affordable-websites'
  );
  await checkA11y(page);
});
