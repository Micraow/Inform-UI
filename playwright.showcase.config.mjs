import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/showcase-browser',
  timeout: 180000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results/showcase',
  use: {
    baseURL: 'http://127.0.0.1:4176',
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  webServer: { command: 'node scripts/serve-showcase.mjs output/showcase index.html', env: { PORT: '4176' }, url: 'http://127.0.0.1:4176', reuseExistingServer: false, timeout: 30000 },
});
