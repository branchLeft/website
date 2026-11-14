import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Waits for in-flight animations so axe measures settled colours. Polls several
 * frames: framer-motion registers its animation a tick after mount, so one check races it.
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
