import { expect, test } from '@playwright/test';

// This file runs only under the `chromium-no-js` project (javaScriptEnabled:
// false — see playwright.config.ts), which verifies the site degrades
// gracefully with no client-side JS. axe-core injects and runs script inside
// the page to compute violations, which doesn't execute in this context, so
// accessibility coverage for this markup stays with the JS-enabled
// `chromium` project's specs instead. Every assertion here uses Playwright's
// CDP-backed locator matchers (toBeVisible/toHaveCSS/etc.), which don't
// depend on the page's own script execution and were confirmed to work
// correctly under javaScriptEnabled: false.

test.describe('sitewide content visibility', () => {
  for (const path of ['/', '/about', '/contact']) {
    test(`${path} renders visible content without JS`, async ({ page }) => {
      await page.goto(path);

      // PageTransition SSRs opacity:0/translateY(10px) as its framer-motion
      // `initial` state — toBeVisible() alone would miss this (it ignores
      // opacity), so assert the computed style directly.
      const pageTransition = page.locator('.bl-page-transition');
      await expect(pageTransition).toHaveCSS('opacity', '1');
      await expect(pageTransition).toHaveCSS('transform', 'none');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
      await expect(heading).not.toHaveText('');
    });
  }
});

test.describe('mobile nav — native <details> disclosure', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger opens the menu and the nested Solutions disclosure works', async ({ page }) => {
    await page.goto('/');

    const mobileDetails = page.locator('.site-nav__mobile-details');
    await expect(mobileDetails).not.toHaveAttribute('open', '');
    await expect(page.getByRole('link', { name: 'About', exact: true })).not.toBeVisible();

    await page.locator('.site-nav__toggle').click();
    await expect(mobileDetails).toHaveAttribute('open', '');
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();

    await mobileDetails.locator('.site-nav__summary').click();
    await expect(page.getByRole('link', { name: 'Local News' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Affordable Websites' })).toBeVisible();

    await page.getByRole('link', { name: 'Local News' }).click();
    await expect(page).toHaveURL('/solutions/local-news');
  });
});

test.describe('desktop nav shows links without any interaction', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('nav links are visible with no click', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();

    const desktopLinks = page.locator('.site-nav__links--desktop');
    await desktopLinks.locator('.site-nav__summary').click();
    await expect(page.getByRole('link', { name: 'Affordable Websites' })).toBeVisible();
  });
});

test.describe('Solutions tabs (About page)', () => {
  test('all three panels are visible and reachable without JS', async ({ page }) => {
    await page.goto('/about');

    const panels: readonly [id: string, href: string][] = [
      ['solutions-panel-local-news', '/solutions/local-news'],
      ['solutions-panel-affordable-websites', '/solutions/affordable-websites'],
      ['solutions-panel-bespoke-technology', '/contact?category=bespoke-technology'],
    ];

    for (const [id, href] of panels) {
      const panel = page.locator(`#${id}`);
      await expect(panel).toHaveCSS('opacity', '1');
      await expect(panel).toHaveCSS('pointer-events', 'auto');
      await expect(panel.getByRole('link')).toHaveAttribute('href', href);
    }
  });
});

test.describe('Values cloud (About page)', () => {
  test('ring is hidden and all 7 value descriptions are visible', async ({ page }) => {
    await page.goto('/about');

    await expect(page.locator('.bl-values-cloud__stage')).not.toBeVisible();

    const panels = page.locator('.bl-values-cloud__accordion-panel-inner');
    await expect(panels).toHaveCount(7);
    const count = await panels.count();
    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i);
      await expect(panel).toHaveCSS('opacity', '1');
      await expect(panel.locator('.bl-values-cloud__accordion-body')).not.toHaveText('');
    }
  });
});

test.describe('contact form', () => {
  // Never submit — the form sends a real email via Gmail SMTP (see
  // tests/contact.spec.ts), and CI has no credentials configured.
  test('is a plain postable HTML form with visible fields', async ({ page }) => {
    await page.goto('/contact');

    const form = page.locator('form.contact-form');
    await expect(form).toHaveAttribute('action', '/contact');
    await expect(form).toHaveAttribute('method', 'post');

    await expect(page.getByLabel('Category')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Message')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });
});

test.describe('SectionNav (About page)', () => {
  test('anchor links navigate via native fragment navigation', async ({ page }) => {
    await page.goto('/about');
    // Scoped to .bl-section-nav — SectionHeading also renders a same-named
    // "#values" permalink on the heading itself, which would otherwise
    // collide with this locator.
    await page.locator('.bl-section-nav').getByRole('link', { name: 'Values' }).click();
    await expect(page).toHaveURL(/#values$/);
  });
});
