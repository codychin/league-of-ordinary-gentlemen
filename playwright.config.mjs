import { defineConfig } from '@playwright/test';

// Never infer a remote target or start/deploy a server as a side effect.
const target = process.env.QA_BASE_URL;
if (!target) throw new Error('Set QA_BASE_URL explicitly (for example http://127.0.0.1:3000).');
const url = new URL(target);
if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
    url.pathname !== '/' || url.search || url.hash) {
  throw new Error('QA_BASE_URL must be an HTTP(S) origin without credentials, path, query or fragment.');
}
if (['ordinarybrief.com', 'www.ordinarybrief.com'].includes(url.hostname.toLowerCase())) {
  throw new Error('Phase One browser QA targets local development or staging, not production.');
}

export default defineConfig({
  testDir: './qa/tests',
  outputDir: './qa/test-results',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'qa/reports/browser-html', open: 'never' }],
    ['json', { outputFile: 'qa/reports/browser-results.json' }],
  ],
  use: {
    baseURL: url.origin,
    browserName: 'chromium',
    navigationTimeout: 45_000,
    actionTimeout: 10_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    // WebKit runs the real shared-shell reading contract, not the full asset suite.
    { name: 'webkit-mobile-390', testMatch: '**/pwa-reading-navigation.spec.mjs', use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
  ],
});
