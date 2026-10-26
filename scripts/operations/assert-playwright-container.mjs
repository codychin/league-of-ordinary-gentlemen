import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
export function assertCompatibility(workflow, lock, installedVersion) {
  const image = workflow.match(/image: (mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-noble@sha256:[a-f0-9]{64})\s/);
  assert.ok(image, 'Release integrity must use a digest-pinned official Noble image');
  for (const name of ['@playwright/test', 'playwright', 'playwright-core']) {
    assert.equal(lock.packages[`node_modules/${name}`]?.version, image[2], `${name} lock version must match container`);
  }
  if (installedVersion !== undefined) assert.equal(installedVersion, image[2], 'Installed Playwright must match container');
  return image[1];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const workflow = readFileSync(new URL('../../.github/workflows/release-integrity.yml', import.meta.url), 'utf8');
  const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
  const image = assertCompatibility(workflow, lock, require('playwright/package.json').version);
  const { chromium, webkit } = require('playwright');
  for (const browserType of [chromium, webkit]) {
    const executable = browserType.executablePath();
    assert.ok(executable.startsWith('/ms-playwright/') && existsSync(executable), `${browserType.name()} must use the image's version-matched browser`);
    const browser = await browserType.launch({ headless: true });
    await browser.close();
  }
  console.log(`Verified Chromium and WebKit in ${image}`);
}
