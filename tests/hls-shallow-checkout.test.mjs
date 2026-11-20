import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
const script = fileURLToPath(new URL('../scripts/operations/fetch-hls-before.sh', import.meta.url));
const git = (cwd,...args) => execFileSync('git',args,{cwd,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const fetchBefore = (cwd, before, event='push') => spawnSync('bash',[script],{cwd,env:{...process.env,BEFORE_SHA:before,GITHUB_EVENT_NAME:event},encoding:'utf8'});
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'shallow-hls-'));
  t.after(() => fs.rmSync(dir,{recursive:true,force:true}));
  const source=path.join(dir,'source');fs.mkdirSync(source);
  git(source,'init');git(source,'config','user.name','Test');git(source,'config','user.email','test@example.invalid');
  fs.writeFileSync(path.join(source,'a'),'old');git(source,'add','.');git(source,'commit','-m','before');
  const before=git(source,'rev-parse','HEAD');
  for(const value of ['middle','new']) {fs.writeFileSync(path.join(source,'a'),value);git(source,'commit','-am',value);}
  const copy=path.join(dir,'copy');git(dir,'clone','--depth=1',pathToFileURL(source).href,copy);
  return {copy,before,dir};
}
test('exact before fetch handles multi-commit push outside depth-one history', t => {
  const {copy,before}=fixture(t);
  assert.throws(()=>git(copy,'diff','--name-only',before,'HEAD'));
  assert.equal(fetchBefore(copy,before).status,0);
  assert.equal(git(copy,'diff','--name-only',before,'HEAD'),'a');
  assert.equal(git(copy,'rev-parse','--is-shallow-repository'),'true');
  assert.equal(git(copy,'rev-list','--count','HEAD'),'1');
});
test('manual dispatch without before performs no git operation', t => {
  const {dir}=fixture(t); // cwd is deliberately not a git repo.
  assert.equal(fetchBefore(dir,'','workflow_dispatch').status,0);
});
test('missing/invalid push boundary fails closed, not full-history fallback', t => {
  const {copy}=fixture(t);
  for(const before of ['', 'main', '0'.repeat(40), '--unshallow']) assert.notEqual(fetchBefore(copy,before).status,0);
  assert.equal(git(copy,'rev-list','--count','HEAD'),'1');
});
test('unfetchable before SHA stops comparison and leaves shallow history', t => {
  const {copy}=fixture(t);
  assert.notEqual(fetchBefore(copy,'f'.repeat(40)).status,0);
  assert.equal(git(copy,'rev-list','--count','HEAD'),'1');
});
test('workflow uses shallow checkout and must fetch before planning',()=>{
  const s=fs.readFileSync(new URL('../.github/workflows/transcode-reels-hls.yml',import.meta.url),'utf8');
  assert.match(s,/fetch-depth: 1/);assert.doesNotMatch(s,/fetch-depth: 0/);
  assert.ok(s.indexOf('run: bash scripts/operations/fetch-hls-before.sh') < s.indexOf('id: plan'));
  assert.match(s,/'scripts\/operations\/fetch-hls-before.sh'/);
});
