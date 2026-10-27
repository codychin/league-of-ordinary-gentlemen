import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertCompatibility, assertWorkflowCompatibility, assertBrowsers } from '../scripts/operations/assert-playwright-container.mjs';
const workflow = readFileSync(new URL('../.github/workflows/release-integrity.yml', import.meta.url), 'utf8');
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
test('container matches every locked Playwright package', () => assertCompatibility(workflow, lock));
test('package upgrades fail until container is updated', () => {
  for (const name of ['@playwright/test', 'playwright', 'playwright-core']) {
    const changed = structuredClone(lock);
    changed.packages[`node_modules/${name}`].version = '0.0.0';
    assert.throws(() => assertCompatibility(workflow, changed), /lock version must match/);
  }
  assert.throws(() => assertCompatibility(workflow, lock, '0.0.0'), /Installed Playwright/);
});
test('mutable image references are rejected', () => {
  assert.throws(() => assertCompatibility(workflow.replace(/@sha256:[a-f0-9]{64}/, ''), lock), /digest-pinned/);
});

const imageWorkflow = readFileSync(new URL('../.github/workflows/article-image-release-gate.yml', import.meta.url), 'utf8');
test('both browser jobs use the same matching image and require the guard without installing browsers', () => {
  assertWorkflowCompatibility([workflow, imageWorkflow], lock);
  for (const source of [workflow, imageWorkflow]) {
    assert.match(source, /run: node scripts\/operations\/assert-playwright-container\.mjs/);
    assert.doesNotMatch(source, /playwright install|apt-get|continue-on-error:/);
  }
});
test('image workflow version or digest drift fails', () => {
  assert.throws(() => assertWorkflowCompatibility([workflow, imageWorkflow.replace('v1.64.1', 'v0.0.0')], lock), /lock version must match/);
  assert.throws(() => assertWorkflowCompatibility([workflow, imageWorkflow.replace(/sha256:[a-f0-9]{64}/, 'sha256:' + '0'.repeat(64))], lock), /same pinned image/);
});
test('missing, stale-path and unlaunchable browsers fail the guard', async () => {
  const browser = { name: () => 'chromium', executablePath: () => '/ms-playwright/chromium/executable', launch: async () => { throw new Error('missing shared library'); } };
  await assert.rejects(assertBrowsers([browser], () => false), /version-matched browser/);
  await assert.rejects(assertBrowsers([{ ...browser, executablePath: () => '/tmp/stale-browser' }], () => true), /version-matched browser/);
  await assert.rejects(assertBrowsers([browser], () => true), /missing shared library/);
});
