import type { Page } from '@playwright/test';
import { THEME_STORAGE_KEY } from '@branchleft/components';

/**
 * Sets the stored theme choice the way a returning visitor's browser would
 * already have it (rather than clicking through the toggle every time), then
 * reloads so the inline theme-init script and the stylesheet's
 * `[data-theme]` selector both pick it up from a fresh navigation.
 */
export async function setStoredTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.evaluate(({ key, value }) => window.localStorage.setItem(key, value), {
    key: THEME_STORAGE_KEY,
    value: theme,
  });
  await page.reload();
}
