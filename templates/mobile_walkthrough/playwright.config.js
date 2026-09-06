import { defineConfig } from '@playwright/test';

const nested = process.env.E2E_NESTED === '1';
const port = 5196;
const nestedPath = '/example/viewer/';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: nested ? /basepath\.spec\.js/ : /.*\.spec\.js/,
  testIgnore: nested ? [] : /basepath\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: nested ? 'test-results/nested' : 'test-results/default',
  use: {
    baseURL: nested ? `http://127.0.0.1:${port}${nestedPath}` : `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    headless: true,
    launchOptions: { args: process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [] },
    trace: 'off',
  },
  webServer: {
    command: nested
      ? 'node tests/e2e/serve-nested.mjs'
      : 'vite --host 127.0.0.1 --port 5196 --strictPort',
    url: nested ? `http://127.0.0.1:${port}${nestedPath}` : `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
