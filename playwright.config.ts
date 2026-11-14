import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    contextOptions: {
      // App components skip/zero their framer-motion durations when this is
      // set (see usePrefersReducedMotion), so axe never observes a mid-fade
      // colour and checkA11y() doesn't have to wait out real animation time.
      reducedMotion: 'reduce',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /no-js\.spec\.ts$/,
    },
    {
      // Safari/iOS is the most CSS-divergent of the major engines and a
      // large share of real UK traffic — desktop WebKit catches rendering
      // differences no-js/chromium alone would miss.
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /no-js\.spec\.ts$/,
    },
    {
      // The full suite at a 390px mobile viewport on WebKit, the engine iOS
      // Safari uses, so every route's default viewport is exercised.
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
      testIgnore: /no-js\.spec\.ts$/,
    },
    {
      // javaScriptEnabled: false stops script in the page, so axe-core cannot
      // run here. Scoped by testMatch to the no-JS specs that assert no-JS layout.
      name: 'chromium-no-js',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
      testMatch: /no-js\.spec\.ts$/,
    },
  ],
  webServer: {
    // Built & served like production — the dev server injects CSS via a
    // client-side <style> tag a tick after first paint, which produces a
    // flash of unstyled content that axe's color-contrast check can catch.
    command: 'pnpm build && pnpm start',
    env: { PORT: String(PORT) },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
