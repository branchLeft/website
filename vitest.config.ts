import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    // Playwright specs live in tests/ and run via `pnpm test:e2e`, not Vitest.
    exclude: [...configDefaults.exclude, 'tests/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Floor set a few points under the actual run (~80/68/78/81 stmts/branches/funcs/lines)
      // so normal variance doesn't flake CI. Ratchet these up as more of app/ gets covered —
      // the point is only to stop coverage silently regressing toward zero.
      thresholds: {
        statements: 75,
        branches: 65,
        functions: 70,
        lines: 75,
      },
    },
  },
});
