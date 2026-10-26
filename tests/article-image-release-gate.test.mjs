import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'

const workflow = readFileSync(new URL('../.github/workflows/release-integrity.yml', import.meta.url), 'utf8')
const promotion = readFileSync(new URL('../.github/workflows/promote-verified-production.yml', import.meta.url), 'utf8')
const marker = '      - name: Verify article image geometry before release\n        run: |\n'
const block = workflow.split(marker)[1]?.split('      - uses:')[0]
test('Release integrity requires geometry before successful automatic promotion', () => {
  assert.ok(block, 'mandatory browser step exists')
  assert.ok(workflow.indexOf('- run: npm run build') < workflow.indexOf(marker))
  assert.match(workflow, /npx playwright install --with-deps chromium/)
  assert.doesNotMatch(workflow, /continue-on-error:/)
  assert.match(block, /QA_BASE_URL=http:\/\/127\.0\.0\.1:3000 npx playwright test qa\/tests\/article-image-framing\.spec\.mjs/)
  assert.match(promotion, /workflows: \["Release integrity", "Article image release gate"\]/)
  assert.match(promotion, /github\.event\.workflow_run\.conclusion == 'success'/)
})
for (const exitCode of [0, 17]) {
  test('geometry command exit ' + exitCode + ' propagates through release step', () => {
    assert.ok(block)
    const dir = mkdtempSync(join(tmpdir(), 'brief-gate-'))
    try {
      for (const [name, body] of Object.entries({npm:'exit 0', curl:'exit 0', npx:'exit ' + exitCode})) {
        writeFileSync(join(dir, name), '#!/bin/sh\n' + body + '\n', {mode:0o755})
      }
      const result = spawnSync('bash', ['-e', '-c', block.split('\n').map(line => line.replace(/^          /, '')).join('\n')], {
        env:{...process.env, PATH:dir + ':' + process.env.PATH}, encoding:'utf8'
      })
      assert.equal(result.status, exitCode, result.stderr)
    } finally { rmSync(dir, {recursive:true, force:true}) }
  })
}
