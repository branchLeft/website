import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

const AVENUE_LINKS = [
  { name: 'PublicPress', url: '/publicpress' },
  { name: 'About', url: '/about' },
  { name: 'Bespoke Solutions', url: '/bespoke' },
] as const;

test.describe('primary nav — desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const link of AVENUE_LINKS) {
    test(`${link.name} navigates and is marked active`, async ({ page }) => {
      await page.goto('/');
      const desktop = page.locator('.site-nav__links--desktop');
      await desktop.getByRole('link', { name: link.name, exact: true }).click();
      await expect(page).toHaveURL(link.url);
      await expect(desktop.getByRole('link', { name: link.name, exact: true })).toHaveClass(
        /site-nav__link--active/
      );
      await checkA11y(page);
    });
  }
});

test.describe('primary nav — mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('tapping a link navigates and closes the menu', async ({ page }) => {
    await page.goto('/');
    const mobileDetails = page.locator('.site-nav__mobile-details');
    await page.locator('.site-nav__toggle').click();
    await expect(mobileDetails).toHaveAttribute('open', '');
    await checkA11y(page);

    await mobileDetails.getByRole('link', { name: 'Bespoke Solutions', exact: true }).click();
    await expect(page).toHaveURL('/bespoke');
    await expect(mobileDetails).not.toHaveAttribute('open', '');
  });
});

test.describe('Blog link', () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 375, height: 812 },
    { width: 360, height: 740 },
    { width: 320, height: 640 },
  ]) {
    test(`shows in the bar without opening the menu at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/about');

      const blog = page.locator('.site-nav').getByRole('link', { name: 'Blog' });
      await expect(blog).toBeVisible();
      await expect(blog).toHaveAttribute('href', 'https://blog.branchleft.co.uk/');
      await expect(blog).toBeInViewport({ ratio: 1 });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
      await checkA11y(page);
    });
  }
});
