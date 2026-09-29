import type { Page } from '@playwright/test';
import { THEME_COOKIE_NAME } from '@branchleft/components';

/**
 * Gives the browser the theme cookie a returning visitor would already have
 * (rather than clicking through the switch every time), then reloads so the
 * server renders `<html data-theme>` from it.
 */
export async function setStoredTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  const url = new URL(page.url());
  await page
    .context()
    .addCookies([{ name: THEME_COOKIE_NAME, value: theme, domain: url.hostname, path: '/' }]);
  await page.reload();
}

/**
 * Opens every `<details>` on the page (the mobile menu, the Solutions
 * submenu, accordions), so axe also measures colours that only appear once
 * something is open.
 */
export async function openEverything(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const details of document.querySelectorAll('details')) details.open = true;
  });
}

/**
 * Puts the contact form into its error state by submitting a message the
 * server rejects. Browser validation is switched off first so the request
 * actually reaches the server, and the wait clears the form's minimum
 * fill time (anything faster is treated as a bot and silently accepted).
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
