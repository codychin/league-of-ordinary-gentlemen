import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
export function assertCompatibility(workflow, lock, installedVersion) {
  const image = workflow.match(/image: (mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-noble@sha256:[a-f0-9]{64})\s/);
  assert.ok(image, 'Browser CI must use a digest-pinned official Noble image');
  for (const name of ['@playwright/test', 'playwright', 'playwright-core']) {
    assert.equal(lock.packages[`node_modules/${name}`]?.version, image[2], `${name} lock version must match container`);
  }
  if (installedVersion !== undefined) assert.equal(installedVersion, image[2], 'Installed Playwright must match container');
  return image[1];
}

export function assertWorkflowCompatibility(workflows, lock, installedVersion) {
  const images = workflows.map(workflow => assertCompatibility(workflow, lock, installedVersion));
  assert.equal(new Set(images).size, 1, 'Browser workflows must use the same pinned image');
  return images[0];
}

export async function assertBrowsers(browserTypes, executableExists = existsSync) {
  for (const browserType of browserTypes) {
    const executable = browserType.executablePath();
    assert.ok(executable.startsWith('/ms-playwright/') && executableExists(executable), `${browserType.name()} must use the image's version-matched browser`);
    const browser = await browserType.launch({ headless: true });
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const workflows = ['release-integrity'].map(name =>
    readFileSync(new URL(`../../.github/workflows/${name}.yml`, import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
  const image = assertWorkflowCompatibility(workflows, lock, require('playwright/package.json').version);
  const { chromium, webkit } = require('playwright');
  await assertBrowsers([chromium, webkit]);
  console.log(`Verified Chromium and WebKit in ${image}`);
}
