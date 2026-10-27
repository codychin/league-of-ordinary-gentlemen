import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {validateCandidate,correction,rotation,localFixture,pilotConfig,JAY} from '../lib/publishing-pilot/model.mjs';
const read=p=>readFileSync(p,'utf8');
const baseline=JSON.parse(read('tests/fixtures/publishing-pilot/baseline.json'));
const expected=JSON.parse(read('tests/fixtures/publishing-pilot/expected.json'));
test('independent approved fixture includes all overflow and archive exception',()=>{
 for(const e of ['loog','sunday-crew','doge']){const s=baseline.editions[e];assert.deepEqual(s.home,expected.home);assert.deepEqual(s.archive,expected.archive);assert.equal(s.articles[JAY].title,expected.leadTitle);assert.equal(s.articles[JAY].dek,expected.leadDek);assert.equal(s.articles[JAY].body.at(-1),expected.lastParagraph);}
});
test('bounded correction, rotation and local fixture preserve full chronology and three cards',()=>{
 for(const r of [baseline,correction(baseline),rotation(baseline),localFixture(baseline)])assert.ok(validateCandidate(r,baseline));
 assert.deepEqual(correction(baseline).editions.loog.home,expected.home);
 assert.deepEqual(rotation(baseline).editions.loog.home.slice(1),expected.home);
 assert.deepEqual(rotation(baseline).editions.loog.home.slice(1,4),expected.home.slice(0,3));
 assert.deepEqual(localFixture(baseline).editions.loog,baseline.editions.loog);
 assert.deepEqual(localFixture(baseline).editions['sunday-crew'],baseline.editions['sunday-crew']);
});
test('unreviewed copy, asset, scope, archive or placement is rejected before QA',()=>{
 for(const mutate of [r=>r.editions.loog.articles[JAY].body.push('<script>bad()</script>'),r=>r.assets.x='bad',r=>r.editions.loog.home.pop(),r=>r.editions.loog.archive.push(JAY),r=>r.schemaVersion=2,r=>r.editions.loog.articles[JAY].scope='doge']){const r=structuredClone(baseline);mutate(r);assert.throws(()=>validateCandidate(r,baseline));}
});
test('pilot never defaults to production or unrelated database',()=>{
 const env={BRIEF_PILOT_ENABLED:'1',BRIEF_PILOT_RENDERER_ID:'test',BRIEF_PILOT_PUBLISHABLE_KEY:'fixture'};
 assert.throws(()=>pilotConfig(env));
 for(const ref of ['dnzdbqycuuoonewcowis','fptdqutdzcxhrponaykv'])assert.throws(()=>pilotConfig({...env,BRIEF_PILOT_SUPABASE_URL:`https://${ref}.supabase.co`,BRIEF_PILOT_VERIFIED_PROJECT_REF:ref}));
 assert.throws(()=>pilotConfig({...env,VERCEL_ENV:'production',BRIEF_PILOT_SUPABASE_URL:'http://127.0.0.1:4319'}));
 assert.equal(pilotConfig({...env,BRIEF_PILOT_SUPABASE_URL:'http://127.0.0.1:4319'}).url,'http://127.0.0.1:4319');
});
test('actual service worker excludes protected pilot navigation and RSC from caches',()=>{
 const handlers={};vm.runInNewContext(read('public/sw.js'),{self:{location:{origin:'https://fixture.test'},addEventListener:(name,fn)=>handlers[name]=fn},URL,Map,Date});
 for(const mode of ['navigate','cors'])for(const path of ['/publishing-pilot/loog?revision=draft','/api/publishing-pilot']){
 let intercepted=false;handlers.fetch({request:{url:'https://fixture.test'+path,method:'GET',mode},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 }
});
