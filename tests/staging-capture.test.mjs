import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('frozen public data matches the recorded production captures',()=>{
 const manifest=JSON.parse(readFileSync('data/staging-capture-manifest.json','utf8'));
 assert.equal(manifest.productionSourceSha,'66e7bde4ac1feaf1444b300c230990f9d5f0ee98');
 for(const item of manifest.files){
  const bytes=readFileSync(item.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.path);
  assert.doesNotMatch(bytes.toString(),/"(?:access_token|refresh_token|service_role|password|email)"\s*:/i,item.path);
 }
});

test('staging score and detail handlers return captured data without network access',async()=>{
 for(const [route,name,file] of [['live-scores','stagingScores','staging-live-scores'],['live-details','stagingDetails','staging-live-details']]){
  const expected=JSON.parse(readFileSync('data/'+file+'.json','utf8'));
  let source=readFileSync('app/api/'+route+'/route.js','utf8').replace(/^import .*;\n/gm,'');
  source='const isStaging=true;const '+name+'='+JSON.stringify(expected)+';\n'+source;
  const {GET}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const previous=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('Unexpected live backend access');};
  try{const response=await GET();assert.deepEqual(await response.json(),{...expected,staging:true});assert.equal(calls,0);}finally{globalThis.fetch=previous;}
 }
});

test('staging matchup pages use the same current-week capture as score cards',()=>{
 const source=readFileSync('app/matchups/[a]/[b]/page.js','utf8');
 assert.match(source,/let latest=isStaging\?stagingScores:latestScores/);
 assert.match(source,/if\(!isStaging\)\{\s*const res=await fetch/);
 assert.doesNotMatch(source,/action=tick/);
});
