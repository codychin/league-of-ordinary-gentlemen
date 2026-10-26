import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertCompatibility } from '../scripts/operations/assert-playwright-container.mjs';
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
