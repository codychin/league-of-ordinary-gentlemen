import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, mkdirSync, cpSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

for (const workflow of ['live-production-monitor.yml','production-route-verification.yml']) {
  test(workflow+' fetches only monitoring inputs, not historical media',()=>{
    const text=readFileSync('.github/workflows/'+workflow,'utf8');
    assert.match(text,/sparse-checkout-cone-mode: false/);
    assert.match(text,/sparse-checkout: \|\n            \/scripts\/operations\/\n            \/app\/components\/SharedEditorialFront.js/);
    assert.doesNotMatch(text,/fetch-depth: 0|^\s+filter:/m);
    assert.match(text,/persist-credentials: false/);
  });
}
test('real route monitor executes with only sparse inputs and fails on broken articles',()=>{
  const dir=mkdtempSync(join(tmpdir(),'brief-monitor-sparse-'));
  try {
    mkdirSync(join(dir,'scripts'),{recursive:true});
    mkdirSync(join(dir,'app/components'),{recursive:true});
    cpSync('scripts/operations',join(dir,'scripts/operations'),{recursive:true});
    cpSync('app/components/SharedEditorialFront.js',join(dir,'app/components/SharedEditorialFront.js'));
    const preload=join(dir,'mock.mjs');
    writeFileSync(preload,`globalThis.fetch=async url=>new Response('<h1>The Brief</h1>',{status:process.env.BROKEN==='1'&&String(url).includes('/articles/')?404:200}); globalThis.setTimeout=(fn)=>{fn();return 0};`);
    for(const broken of ['0','1']){
      const result=spawnSync(process.execPath,['--import',preload,'scripts/operations/monitor-public-routes.mjs'],{cwd:dir,encoding:'utf8',timeout:10000,env:{...process.env,REPORT_PATH:join(dir,'report.json'),BROKEN:broken}});
      assert.equal(result.error,undefined,result.error?.message);
      assert.equal(result.status,Number(broken),result.stderr);
      const report=JSON.parse(readFileSync(join(dir,'report.json'),'utf8'));
      assert.ok(report.count>=27);
      assert.equal(report.failures.length===0,broken==='0');
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});
