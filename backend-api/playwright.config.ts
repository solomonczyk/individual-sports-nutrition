import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Testing
 */

export default defineConfig({
  testDir: './src/e2e-tests',
  testMatch: '**/*.e2e.ts',

  // Configuration options
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  // Test timeout: 30 seconds per test
  timeout: 30 * 1000,

  // Global timeout: 5 minutes
  globalTimeout: 5 * 60 * 1000,

  // Expect timeout: 5 seconds
  expect: {
    timeout: 5000
  },

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Trace on failure
    trace: 'retain-on-failure',

    // Set HTTP headers
    extraHTTPHeaders: {
      'X-Test-Source': 'playwright-e2e',
    },
  },

  // Projects: define configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

