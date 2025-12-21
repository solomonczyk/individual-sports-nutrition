import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Testing
 * 
 * Features:
 * - Web testing (Chrome, Firefox, Safari)
 * - Mobile testing emulation
 * - Screenshots and videos on failure
 * - Parallel execution
 * - Custom reporters
 */

export default defineConfig({
  testDir: './src/e2e-tests',
  testMatch: '**/*.e2e.ts',
  
  // Configuration options
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Test timeout: 30 seconds per test
  timeout: 30000,

  // Global timeout: 5 minutes
  globalTimeout: 5 * 60 * 1000,

  // Expect timeout: 5 seconds
  expect: {
    timeout: 5000,
  },

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
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

    // Trace on failure (can be viewed with `npx playwright show-trace`)
    trace: 'on-first-failure',

    // Set HTTP headers
    extraHTTPHeaders: {
      'X-Test-Source': 'playwright-e2e',
    },
  },

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Projects: define configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
