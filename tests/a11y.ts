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
 *
 * `document.getAnimations()` is polled across a few frames rather than
 * checked once: framer-motion registers its WAAPI animation from an effect
 * that fires a tick after mount, so a single synchronous check can catch the
 * gap before that animation exists yet, return an empty list, and let axe
 * run while the animation is about to start (or still correcting its
 * duration post-hydration). That race is timing-sensitive enough to pass
 * locally and flake under CI's slower/shared runners.
 */
async function waitForAnimationsSettled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

    let animations = document.getAnimations();
    for (let i = 0; i < 5 && animations.length === 0; i++) {
      await nextFrame();
      animations = document.getAnimations();
    }

    await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
  });
}

export async function checkA11y(page: Page): Promise<void> {
  await waitForAnimationsSettled(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}
