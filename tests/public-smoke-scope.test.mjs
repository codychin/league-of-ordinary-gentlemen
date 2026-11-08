import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
function run(mode='valid'){
 const dir=mkdtempSync(join(tmpdir(),'brief-smoke-scope-'));
 try{
  const mock=join(dir,'mock.mjs'),log=join(dir,'requests.jsonl');
  writeFileSync(mock,`import {appendFileSync} from 'node:fs';
   globalThis.fetch=async input=>{const path=new URL(input).pathname;appendFileSync(${JSON.stringify(log)},JSON.stringify(path)+'\\n');
   if(path.includes('/articles/'))return new Response('<h1>A new approved sports story</h1><p>The Brief</p>',{status:${mode==='missing-article'?404:200}});
   const root=path==='/'?'':path;
   const lead=${mode==='wrong-edition'?'""':'root'}+'/articles/new-approved-story';
   return new Response('<p>The Brief</p><section aria-label="Lead story: A new approved sports story"><a href="'+lead+'">Story</a></section><section aria-label="Recent stories">'+ '<h3>New story</h3>'.repeat(${mode==='four-cards'?4:3})+'</section>',{status:${mode==='protected'?302:200}});
  };`);
  const env={...process.env,BASE_URL:'https://candidate.vercel.app',NODE_OPTIONS:'--import='+mock};
  for(const key of ['ARTICLE_SLUG','EXPECTED_TITLE','EDITORIAL_RELEASE_MANIFEST','VERCEL_TRUSTED_OIDC_TOKEN','RELEASE_CANARY_FAIL'])delete env[key];
  const result=spawnSync(process.execPath,[resolve('scripts/operations/check-public-routes.mjs')],{env,encoding:'utf8'});
  return {...result,requests:readFileSync(log,'utf8').trim().split('\n').map(JSON.parse)};
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test('generic smoke accepts new editorial content and discovers current edition leads',()=>{
 const result=run();assert.equal(result.status,0,result.stderr);
 assert.deepEqual(result.requests,['/','/sunday-crew','/doge','/articles/new-approved-story','/sunday-crew/articles/new-approved-story','/doge/articles/new-approved-story']);
});
for(const mode of ['missing-article','wrong-edition','four-cards','protected'])test('generic smoke rejects '+mode,()=>assert.notEqual(run(mode).status,0));
test('promotion checkout includes smoke dependency and explicit release expectations',()=>{
 const workflow=readFileSync('.github/workflows/promote-verified-production.yml','utf8');
 assert.match(workflow,/\/scripts\/operations\/check-editorial-release.mjs/);
 assert.match(workflow,/\/qa\/release-expectations\//);
});
