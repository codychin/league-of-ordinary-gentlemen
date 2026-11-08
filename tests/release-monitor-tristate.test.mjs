import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {releaseReport} from '../scripts/operations/monitor-release-state.mjs';
test('unknown is not a passed check or a failure and does not mutate incidents',()=>{
 const report=releaseReport({ok:null,reason:'promotion-job-succeeded-live-unverified'},'abc');
 assert.equal(report.status,'unverified');assert.equal(report.passed,0);assert.equal(report.unverified,1);assert.deepEqual(report.failures,[]);
 const dir=mkdtempSync(join(tmpdir(),'release-tristate-'));
 try {
  const file=join(dir,'report.json');writeFileSync(file,JSON.stringify(report));
  const result=spawnSync(process.execPath,['scripts/operations/monitor-incident.mjs'],{env:{...process.env,REPORT_PATH:file,GITHUB_TOKEN:'',GITHUB_REPOSITORY:''},encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/no incident mutation or recovery claim/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('known failure remains an incident and known healthy status remains passed',()=>{
 assert.equal(releaseReport({ok:false,reason:'failed'},'abc').failures.length,1);
 assert.equal(releaseReport({ok:true},'abc').passed,1);
});
