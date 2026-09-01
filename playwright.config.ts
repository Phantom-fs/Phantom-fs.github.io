import { defineConfig, devices } from '@playwright/test';

const quoteCommandArgument = (value: string) =>
  `"${value.replaceAll('"', '\\"')}"`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `${quoteCommandArgument(process.execPath)} ./scripts/e2e/production-server.mjs`,
    reuseExistingServer: true,
    timeout: 120_000,
    url: 'http://127.0.0.1:4321/404.html'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
