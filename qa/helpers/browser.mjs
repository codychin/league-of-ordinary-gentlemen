import { test as base, expect } from '@playwright/test';

export function collectJavaScriptErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`Uncaught: ${error.message}`));
  // Resource/third-party console noise is not automatically a major JS error.
  page.on('console', message => {
    if (message.type() === 'error' && /hydration|react error|uncaught|unhandled|TypeError|ReferenceError|SyntaxError/i.test(message.text())) {
      errors.push(`Console: ${message.text()}`);
    }
  });
  return errors;
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = collectJavaScriptErrors(page);
    await use(page);
    await testInfo.attach('javascript-errors', { body: JSON.stringify(errors, null, 2), contentType: 'application/json' });
    expect(errors, 'Major JavaScript errors across all visited routes').toEqual([]);
  },
});
export { expect };

export async function inspectImages(page) {
  return page.evaluate(async () => {
    const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    const failures = [];
    const check = async (image, source, kind) => {
      try {
        await Promise.race([
          image.decode(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('decode timeout')), 12_000)),
        ]);
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('zero dimensions');
      } catch (error) { failures.push({ kind, source, error: error.message }); }
    };
    // Native scrolling triggers lazy content without changing React-owned attributes
    // before hydration (which would create a QA-induced hydration mismatch).
    const images = [...document.images].filter(visible);
    for (const image of images) {
      image.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      await new Promise(requestAnimationFrame);
      await check(image, image.currentSrc || image.src, 'img');
    }
    const assets = [];
    for (const element of document.querySelectorAll('body *')) {
      if (!visible(element)) continue;
      if (element.classList.contains('resilientImageFallback')) {
        failures.push({ kind: 'fallback', source: element.getAttribute('aria-label'), error: 'Image replaced with branded fallback' });
      }
      for (const pseudo of [null, '::before', '::after']) {
        const background = getComputedStyle(element, pseudo).backgroundImage;
        for (const match of background.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g)) {
          assets.push({ kind: 'background', source: match[1] ?? match[2] ?? match[3].trim() });
        }
      }
      if (element instanceof HTMLVideoElement && element.poster) assets.push({ kind: 'poster', source: element.poster });
    }
    await Promise.all([
      ...[...new Map(assets.map(asset => [asset.source, asset])).values()].map(async asset => {
        const image = new Image();
        image.src = asset.source;
        await check(image, asset.source, asset.kind);
      }),
    ]);
    // React may replace failed images while decode promises settle.
    document.querySelectorAll('.resilientImageFallback').forEach(element => {
      if (visible(element)) failures.push({ kind: 'fallback', source: element.getAttribute('aria-label'), error: 'Image replaced with branded fallback' });
    });
    return { imageCount: images.length, backgroundAndPosterCount: new Set(assets.map(asset => asset.source)).size, failures };
  });
}

export async function expectImages(page, testInfo) {
  const report = await inspectImages(page);
  await testInfo.attach('image-audit', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  expect(report.imageCount + report.backgroundAndPosterCount, 'Page contains image assets').toBeGreaterThan(0);
  expect(report.failures, 'All displayed img, CSS background and poster assets decode').toEqual([]);
}
