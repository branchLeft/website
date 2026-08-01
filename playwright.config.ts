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
      // javaScriptEnabled: false disables script execution in the page's
      // browsing context — the same axe-core relies on to run, so a11y
      // checks are intentionally out of scope for this project (see
      // tests/no-js.spec.ts header comment). Scoped to its own spec file
      // via testMatch since several assertions here are only true in a
      // no-JS context (e.g. the values-cloud accordion being force-open).
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
