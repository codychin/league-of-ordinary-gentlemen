import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {mediaCiInputs} from '../scripts/operations/media-ci-inputs.mjs';
import {releaseBrowserPolicy} from '../qa/helpers/release-policy.mjs';
const require=createRequire(import.meta.url);
const workflow=readFileSync('.github/workflows/release-integrity.yml','utf8');
const media=workflow.split('  media-preparation:\n')[1].split('  integrity:\n')[0];

test('sparse checkout exactly covers manifest-derived real media fixtures',()=>{
  const patterns=media.split('          sparse-checkout: |\n')[1].split('      - uses:')[0].trim().split('\n').map(line=>line.trim());
  assert.deepEqual(patterns,mediaCiInputs());
  assert.match(media,/sparse-checkout-cone-mode: false/);
  assert.doesNotMatch(media,/^\s+filter:|fetch-depth: 0/m);
  assert.equal(patterns.filter(p=>p.startsWith('/public/reels/')).length,6);
  assert.equal(patterns.filter(p=>p.startsWith('/public/reels-hls/')).length,6);
  assert.match(media,/run: node --test qa\/operations\/media-preparation.test.mjs/);
});
test('cancel only superseded PR validation, never main or a dispatch',()=>{
  assert.match(workflow,/group: release-integrity-\$\{\{ github.event_name == 'pull_request' && format\('pr-\{0\}', github.event.pull_request.number\) \|\| github.run_id \}\}/);
  assert.match(workflow,/cancel-in-progress: \$\{\{ github.event_name == 'pull_request' \}\}/);
});
test('required integrity still waits for real media and retains read-only credentials',()=>{
  assert.match(workflow,/integrity:\n    needs: media-preparation/);
  assert.match(workflow,/permissions:\n  contents: read/);
  assert.equal((workflow.match(/persist-credentials: false/g)||[]).length,2);
  assert.match(workflow,/timeout-minutes: 30/);
  assert.doesNotMatch(workflow,/continue-on-error|actions: write|contents: write|id-token:/);
});
test('CI parallelism and fail-fast never change retry or local diagnostic policy',()=>{
  assert.deepEqual(releaseBrowserPolicy({CI:'true'}),{workers:2,retries:0,maxFailures:1,forbidOnly:true});
  for(const CI of [undefined,'false',''])assert.deepEqual(releaseBrowserPolicy({CI}),{workers:1,retries:0,maxFailures:0,forbidOnly:false});
  const config=readFileSync('playwright.config.mjs','utf8');
  assert.match(config,/\.\.\.releaseBrowserPolicy\(\)/);
  assert.doesNotMatch(config,/fullyParallel:\s*true/);
  for(const project of ['webkit-mobile-390','webkit-input-390','desktop','mobile-390','mobile-360'])assert.ok(config.includes(`name: '${project}'`));
});
test('real Playwright fail-fast returns failure and does not run the remaining cases',()=>{
  const dir=mkdtempSync(join(tmpdir(),'brief-ci-failfast-'));
  try {
    const module=pathToFileURL(join(dirname(require.resolve('@playwright/test/package.json')),'index.mjs')).href;
    writeFileSync(join(dir,'playwright.config.mjs'),`export default ${JSON.stringify({...releaseBrowserPolicy({CI:'true'}),testDir:dir,outputDir:join(dir,'results'),reporter:[['json']]})};`);
    writeFileSync(join(dir,'probe.spec.mjs'),`import {test} from ${JSON.stringify(module)};\ntest('intentional gate failure',()=>{throw Error('fail-closed-canary')});\n`+Array.from({length:8},(_,i)=>`test('must remain unverified ${i}',()=>{});`).join('\n'));
    const result=spawnSync(process.execPath,[join(dirname(require.resolve('@playwright/test/package.json')),'cli.js'),'test','--config',join(dir,'playwright.config.mjs')],{encoding:'utf8',timeout:30000,env:{...process.env,CI:'true'}});
    assert.equal(result.error,undefined,result.error?.message);
    assert.equal(result.status,1,result.stdout+result.stderr);
    const report=JSON.parse(result.stdout);
    assert.equal(report.stats.unexpected,1);
    assert.equal(report.stats.expected,0);
    assert.ok(report.stats.skipped>0,'Unrun cases must not count as passed');
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('Culture styling is independently checked for every edition and browser project',()=>{
  const result=spawnSync(process.execPath,[join(dirname(require.resolve('@playwright/test/package.json')),'cli.js'),'test','qa/tests/section-anchor-alignment.spec.mjs','--list','--reporter=json'],{encoding:'utf8',timeout:30000,env:{...process.env,QA_BASE_URL:'http://127.0.0.1:3000'}});
  assert.equal(result.error,undefined,result.error?.message);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const report=JSON.parse(result.stdout);
  const specs=report.suites.flatMap(s=>s.specs||[]).filter(s=>s.title.startsWith('Culture pagination and floating masthead'));
  const projects=['webkit-mobile-390','webkit-input-390','desktop','mobile-390','mobile-360'];
  assert.equal(specs.length,15,'Each of three editions must get its own fixture in all five projects');
  for(const project of projects)for(const root of ['/','/doge','/sunday-crew']){
    assert.equal(specs.filter(s=>s.title.endsWith(`sections: ${root}`)&&s.tests.some(t=>t.projectName===project)).length,1);
  }
});
