import type { Page } from '@playwright/test';
import { THEME_COOKIE_NAME } from '@branchleft/components';

/**
 * Gives the browser the theme cookie a returning visitor would have, then
 * reloads so the server renders the theme from it.
 */
export async function setStoredTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  const url = new URL(page.url());
  await page
    .context()
    .addCookies([{ name: THEME_COOKIE_NAME, value: theme, domain: url.hostname, path: '/' }]);
  await page.reload();
}

/**
 * Opens every `<details>` on the page, so axe also measures colours that only
 * appear once something is open.
 */
export async function openEverything(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const details of document.querySelectorAll('details')) details.open = true;
  });
}

/**
 * Submits a message the server rejects, so the contact form shows its error.
 * Browser validation is off, and the wait clears the minimum fill time.
 */
export async function showContactError(page: Page): Promise<void> {
  await page.goto('/contact');
  await page.locator('form:has(.contact-form__submit)').evaluate((form) => {
    (form as HTMLFormElement).noValidate = true;
  });
  await page.getByLabel(/email/i).fill('someone@example.com');
  await page.getByLabel(/message/i).fill('hi');
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.locator('.contact-form__status--error').waitFor();
}
