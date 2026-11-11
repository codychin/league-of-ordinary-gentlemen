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
  // Verify each release environment, not a global count that also includes the
  // separately authorized Week 9 branch. All three invocations have a purpose.
  const step = name => {
    const marker = `      - name: ${name}\n`;
    assert.equal(workflow.split(marker).length, 2, `Unique workflow step: ${name}`);
    return workflow.split(marker)[1].split(/\n      - (?:name:|uses:)/)[0];
  };
  const unmocked = step('Verify article images without score fixture');
  const scored = step('Verify article image geometry before release');
  const focused = step('Focused owner-authorized Week 9 verification, not a full suite');
  const framingInvocations = text => text.split('\n').filter(line =>
    /^\s*QA_BASE_URL=\S+ npx playwright test /.test(line) &&
    /(?:^|\s)qa\/tests\/article-image-framing\.spec\.mjs(?:\s|$)/.test(line));
  for (const [name, block, port] of [['unmocked', unmocked, 3001], ['score fixture', scored, 3000]]) {
    assert.equal(framingInvocations(block).length, 1, `${name} must execute framing once`);
    assert.ok(framingInvocations(block)[0].includes(`QA_BASE_URL=http://127.0.0.1:${port} `), `${name} browser target`);
    assert.ok(block.includes(`npm run start -- -p ${port}`), `${name} server port`);
    assert.ok(block.includes(`curl -fsS http://127.0.0.1:${port}/articles/maude-nfc-east-declines-winner`), `${name} readiness check`);
    assert.ok(block.includes('test "$ready" = true'), `${name} readiness must fail closed`);
  }
  assert.doesNotMatch(unmocked, /NODE_OPTIONS|pwa-shell-scores\.cjs/);
  assert.ok(unmocked.includes('qa/tests/week9-written-previews.spec.mjs'));
  assert.ok(scored.includes('NODE_OPTIONS="--require=$PWD/qa/fixtures/pwa-shell-scores.cjs" npm run start -- -p 3000'));
  // The focused path is not a replacement for either normal environment.
  assert.equal(framingInvocations(focused).length, 1);
  assert.ok(focused.includes("if: ${{ github.event_name == 'pull_request' && ((github.event.pull_request.number == 141 && github.head_ref == 'fix/week9-approved-video-release') || github.head_ref == 'release/week9-rollback-shell') }}"));
  assert.match(focused, /if \[ "\$GITHUB_HEAD_REF" = release\/week9-rollback-shell \]; then[\s\S]*?else\n\s+QA_BASE_URL=http:\/\/127\.0\.0\.1:3000 npx playwright test qa\/tests\/pwa-reading-navigation\.spec\.mjs[^\n]*\n\s+QA_BASE_URL=http:\/\/127\.0\.0\.1:3000 npx playwright test qa\/tests\/article-image-framing\.spec\.mjs --workers=1\n\s+fi/);
  assert.equal(unmocked.match(/if: ([^\n]+)/)?.[1], scored.match(/if: ([^\n]+)/)?.[1], 'Both normal environments have the same eligibility');
  assert.match(unmocked, /if: \$\{\{ !\(github\.event_name == 'pull_request'/);

  for (const required of ['npm test', 'qa/operations/media-preparation.test.mjs', 'assert-playwright-container.mjs', 'qa/tests/scorecard-divider-regression.spec.mjs', 'qa/tests/pwa-reading-navigation.spec.mjs', 'NODE_OPTIONS="--require=$PWD/qa/fixtures/pwa-shell-scores.cjs"', 'name: article-image-qa-report', 'name: release-integrity-image-report']) {
    assert.ok(workflow.indexOf(required) < workflow.indexOf('id: evidence'), required);
    assert.ok(workflow.includes(required), required);
  }
  assert.match(workflow, /article-image-qa:\n    needs: integrity\n    if: \$\{\{ always\(\) \}\}/);
  assert.match(workflow, /CHECKED_OUT_SHA: \$\{\{ steps.source.outputs.commit \}\}/);
  assert.match(workflow, /uses: actions\/checkout@v4\n        id: source/);
  assert.doesNotMatch(workflow, /download-artifact|continue-on-error/);
  assert.equal(existsSync('.github/workflows/article-image-release-gate.yml'), false);
});

const record = workflow.split('      - name: Record successful validation identity\n')[1].split('  # Preserve')[0].split('        run: |\n')[1].replace(/^          /gm, '');
for (const checkedOut of [identity.GITHUB_SHA, '', 'b'.repeat(40)]) {
  test(`checkout action commit output is required and exact: ${checkedOut || 'missing'}`, () => {
    const result = spawnSync('sh', ['-e', '-c', record], {env:{...identity, CHECKED_OUT_SHA:checkedOut, GITHUB_OUTPUT:'/dev/null'}});
    assert.equal(result.status === 0, checkedOut === identity.GITHUB_SHA);
  });
}
test('identity recording does not alter Git trust configuration or depend on container ownership', () => {
  assert.doesNotMatch(record, /git |safe.directory/);
});
