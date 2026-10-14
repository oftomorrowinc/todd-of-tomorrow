import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      // The build log's feed, a fixture: the sidebar is built from it and the browser reads it again.
      command: 'node tests/fixtures/log-feed.mjs',
      url: 'http://localhost:4397/api/log',
      reuseExistingServer: !process.env.CI,
    },
    {
      // The built site, not the dev server: what ships, and no dev toolbar in the DOM.
      command: 'npm run build && npm run preview',
      url: 'http://localhost:4321',
      reuseExistingServer: !process.env.CI,
      env: { LOG_FEED_URL: 'http://localhost:4397/api/log' },
    },
  ],
});