import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /routing\.base\.spec\.ts/,
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4174/AnimaSpellBook/',
    trace: 'on-first-retry',
  },
  webServer: {
    command:
      'npm run build && GITHUB_PAGES=1 npm run preview -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174/AnimaSpellBook/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
