import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const workflow = readFileSync('.github/workflows/release-integrity.yml', 'utf8');
const gate = workflow.split('      - name: Require successful validation of this exact run\n')[1];
const script = gate.split('        run: |\n')[1].replace(/^          /gm, '');
const identity = {GITHUB_SHA:'a'.repeat(40), GITHUB_RUN_ID:'123', GITHUB_RUN_ATTEMPT:'2', GITHUB_WORKFLOW_REF:'codychin/league-of-ordinary-gentlemen/.github/workflows/release-integrity.yml@refs/pull/103/merge'};
const evidence = Object.values(identity).join(':');
function run(patch = {}) {
  return spawnSync('bash', ['-e', '-c', script], {env:{...identity, VALIDATION_RESULT:'success', VALIDATION_IDENTITY:evidence, ...patch}}).status;
}
test('same-run successful exact-commit evidence passes without fetching artifacts', () => assert.equal(run(), 0));
for (const result of ['failure', 'cancelled', 'skipped', '', 'in_progress']) {
  test(`dependency result ${result || 'missing'} fails closed`, () => assert.notEqual(run({VALIDATION_RESULT:result}), 0));
}
for (const key of Object.keys(identity)) {
  test(`missing or mismatched ${key} fails closed`, () => {
    assert.notEqual(run({[key]:''}), 0);
    assert.notEqual(run({[key]:'different'}), 0);
  });
}
for (const value of ['', 'a'.repeat(40), evidence.replace(':2:', ':1:'), evidence.replace('a'.repeat(40), 'b'.repeat(40))]) {
  test(`missing, stale attempt, or other commit evidence fails: ${value.slice(0,45)}`, () => assert.notEqual(run({VALIDATION_IDENTITY:value}), 0));
}
test('one install/build retains both server environments and all suites before evidence', () => {
  assert.equal((workflow.match(/run: npm ci\n/g) || []).length, 1);
  assert.equal((workflow.match(/run: npm run build\n/g) || []).length, 1);
  assert.equal((workflow.match(/qa\/tests\/article-image-framing.spec.mjs/g) || []).length, 2);
  for (const required of ['npm test', 'qa/operations/media-preparation.test.mjs', 'assert-playwright-container.mjs', 'qa/tests/scorecard-divider-regression.spec.mjs', 'qa/tests/pwa-reading-navigation.spec.mjs', 'NODE_OPTIONS="--require=$PWD/qa/fixtures/pwa-shell-scores.cjs"', 'name: article-image-qa-report', 'name: release-integrity-image-report']) {
    assert.ok(workflow.indexOf(required) < workflow.indexOf('id: evidence'), required);
    assert.ok(workflow.includes(required), required);
  }
  assert.match(workflow, /article-image-qa:\n    needs: integrity\n    if: \$\{\{ always\(\) \}\}/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$EXPECTED_SHA"/);
  assert.doesNotMatch(workflow, /download-artifact|continue-on-error/);
  assert.equal(existsSync('.github/workflows/article-image-release-gate.yml'), false);
});
