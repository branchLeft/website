import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test.describe('Solutions nav dropdown — desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // Scoped to .site-nav__links--desktop — the mobile <details> disclosure
  // renders the same Solutions dropdown markup (hidden via CSS at this
  // viewport), so an unscoped .site-nav__details/.site-nav__summary
  // locator would match both and hit a Playwright strict-mode violation.

  test('opens on click, links to both solution pages, and passes a11y', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page);

    const details = page.locator('.site-nav__links--desktop .site-nav__details');
    const summary = page.locator('.site-nav__links--desktop .site-nav__summary');

    await expect(details).not.toHaveAttribute('open', '');
    await summary.click();
    await expect(details).toHaveAttribute('open', '');

    await expect(page.getByRole('link', { name: 'Local News' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Affordable Websites' })).toBeVisible();
    await checkA11y(page);
  });

  test('closes on Escape and returns focus to the summary', async ({ page }) => {
    await page.goto('/');
    const details = page.locator('.site-nav__links--desktop .site-nav__details');
    const summary = page.locator('.site-nav__links--desktop .site-nav__summary');

    await summary.click();
    await expect(details).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
  });

  test('closes on outside click', async ({ page }) => {
    await page.goto('/');
    const details = page.locator('.site-nav__links--desktop .site-nav__details');
    const summary = page.locator('.site-nav__links--desktop .site-nav__summary');

    await summary.click();
    await expect(details).toHaveAttribute('open', '');
    await page.mouse.click(10, 10);
    await expect(details).not.toHaveAttribute('open', '');
  });

  test('navigates to the local news solution page', async ({ page }) => {
    await page.goto('/');
    await page.locator('.site-nav__links--desktop .site-nav__summary').click();
    await page.getByRole('link', { name: 'Local News' }).click();
    await expect(page).toHaveURL('/solutions/local-news');
  });

  test('navigates to the affordable websites solution page', async ({ page }) => {
    await page.goto('/');
    await page.locator('.site-nav__links--desktop .site-nav__summary').click();
    await page.getByRole('link', { name: 'Affordable Websites' }).click();
    await expect(page).toHaveURL('/solutions/affordable-websites');
  });

  test('highlights Solutions nav item when on a solutions sub-page', async ({ page }) => {
    await page.goto('/solutions/local-news');
    const summary = page.locator('.site-nav__links--desktop .site-nav__summary');
    await expect(summary).toHaveClass(/site-nav__link--active/);
  });
});

test.describe('Solutions nav disclosure — mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger menu reveals the Solutions disclosure with nested links', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page);

    const mobileDetails = page.locator('.site-nav__mobile-details');
    const menuToggle = page.locator('.site-nav__toggle');
    await expect(mobileDetails).not.toHaveAttribute('open', '');
    await menuToggle.click();
    await expect(mobileDetails).toHaveAttribute('open', '');

    const summary = mobileDetails.locator('.site-nav__summary');
    await expect(summary).toBeVisible();
    await summary.click();
    await expect(page.getByRole('link', { name: 'Local News' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Affordable Websites' })).toBeVisible();
    await checkA11y(page);
  });

  test('tapping a solution link navigates and closes the menu', async ({ page }) => {
    await page.goto('/');
    const mobileDetails = page.locator('.site-nav__mobile-details');
    await page.locator('.site-nav__toggle').click();
    await mobileDetails.locator('.site-nav__summary').click();
    await page.getByRole('link', { name: 'Affordable Websites' }).click();

    await expect(page).toHaveURL('/solutions/affordable-websites');
    await expect(mobileDetails).not.toHaveAttribute('open', '');
  });
});
