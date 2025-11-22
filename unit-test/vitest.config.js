import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Coverage reporting disabled in this lightweight test config to avoid
    // requiring optional coverage provider packages in the unit-test folder.
    // Add a coverage section if you want coverage reporting and install the
    // appropriate provider (e.g. @vitest/coverage-v8).
    setupFiles: [],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, '../walletalert/apps/api/src'),
      '@web': path.resolve(__dirname, '../walletalert/apps/web/src')
    }
  }
});
