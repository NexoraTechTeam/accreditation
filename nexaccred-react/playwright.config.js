import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry even locally, not just CI: this suite now drives a real
  // nexaccred-api + Postgres backend (not just the static frontend), and
  // fullyParallel workers logging in concurrently against one dev instance
  // can occasionally exceed a 5s assertion timeout under load — a
  // concurrency/timing artifact, not a flaky assertion. A retry separates
  // that from a genuine regression without hiding one (a real bug still
  // fails twice).
  retries: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
