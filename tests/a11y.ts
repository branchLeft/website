import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Waits for any in-flight CSS/Web Animations on the page to finish, so axe
 * measures settled colours rather than a mid-animation blend.
 *
 * `playwright.config.ts` sets `reducedMotion: 'reduce'`, and app components
 * zero their framer-motion durations in response (see
 * `usePrefersReducedMotion`), so this should normally resolve immediately —
 * it's a defensive backstop for any animation that doesn't check the
 * preference, not the primary mechanism.
 */
async function waitForAnimationsSettled(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => {})))
  );
}

export async function checkA11y(page: Page): Promise<void> {
  await waitForAnimationsSettled(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}
