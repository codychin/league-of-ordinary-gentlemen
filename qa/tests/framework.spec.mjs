import { test, expect } from '@playwright/test';
import { inspectImages, collectJavaScriptErrors } from '../helpers/browser.mjs';

// Synthetic regression tests exercise the detector without relying on the site/CDNs.
test('detects broken, pending, CSS and branded fallback images', async ({ page }) => {
  await page.route('**/qa-fixture/**', async route => {
    if (route.request().url().endsWith('/pending.png')) return; // stays pending until page closes
    await route.fulfill({ status: 404, body: 'missing' });
  });
  await page.setContent(`<img src="http://qa-fixture.invalid/qa-fixture/broken.png">
    <img loading="lazy" src="http://qa-fixture.invalid/qa-fixture/pending.png">
    <div style="height:30px;background-image:linear-gradient(red,blue),url('http://qa-fixture.invalid/qa-fixture/background.png')"></div>
    <div class="resilientImageFallback" role="img" aria-label="failed photo">THE BRIEF</div>`);
  const report = await inspectImages(page);
  expect(report.failures.some(f => f.kind === 'img' && f.source.endsWith('/broken.png'))).toBe(true);
  expect(report.failures.some(f => f.kind === 'img' && f.source.endsWith('/pending.png') && f.error === 'decode timeout')).toBe(true);
  expect(report.failures.some(f => f.kind === 'background' && f.source.endsWith('/background.png'))).toBe(true);
  expect(report.failures.some(f => f.kind === 'fallback')).toBe(true);
});

test('valid images decode and major JavaScript errors are captured', async ({ page }) => {
  const errors = collectJavaScriptErrors(page);
  const svg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>');
  await page.setContent(`<img src="${svg}"><div style="height:20px;background-image:url('${svg}')"></div>`);
  expect((await inspectImages(page)).failures).toEqual([]);
  await page.evaluate(() => {
    console.error('Hydration failed: QA fixture');
    setTimeout(() => { throw new TypeError('QA fixture uncaught'); }, 0);
  });
  await expect.poll(() => errors.length).toBe(2);
});
