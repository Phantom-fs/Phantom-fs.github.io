import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig(baseConfig, {
  testDir: './tests/visual',
  testMatch: '**/*.visual.spec.ts',
  fullyParallel: false,
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05
    }
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
