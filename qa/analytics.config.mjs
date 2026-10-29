import {defineConfig} from '@playwright/test';
const baseURL=process.env.QA_BASE_URL;
if (!baseURL || !['localhost','127.0.0.1'].includes(new URL(baseURL).hostname)) throw Error('Analytics verification is local-only. Set QA_BASE_URL.');
export default defineConfig({testDir:'./tests',outputDir:'./test-results/analytics',testMatch:'web-analytics.spec.mjs',workers:1,timeout:60000,use:{baseURL,serviceWorkers:'block',launchOptions:{executablePath:process.env.QA_CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']}}});
