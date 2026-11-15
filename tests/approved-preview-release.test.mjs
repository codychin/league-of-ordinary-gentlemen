import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {approvedPreviewRelease,loadApprovedPreviewRelease,validateReleaseHistory} from '../lib/approved-preview-release.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const definition=read('data/active-preview-release.json');
test('one approved definition selects all current league cohorts and retains exact Week9 history',()=>{
 const result=loadApprovedPreviewRelease();assert.equal(result.week,10);
 assert.deepEqual(result.rows,read('data/week10-approved-homepage-media.json').sort((a,b)=>['loog','doge','sunday-crew'].indexOf(a.edition)-['loog','doge','sunday-crew'].indexOf(b.edition)));
 assert.equal(result.historical.length,1);assert.equal(result.historical[0].week,9);
 for(const edition of ['loog','doge','sunday-crew']){
  assert.equal(result.rows.filter(r=>r.edition===edition).length,6);
  assert.equal(result.historical[0].rows.filter(r=>r.edition===edition).length,6);
 }
});
test('explicit supported Week9 selection works; unsupported next week cannot inherit an exception',()=>{
 assert.equal(approvedPreviewRelease({version:1,current:{policy:'week9-owner-waiver-2026'},historical:[]},read).week,9);
 for(const current of [{policy:'week11-owner-approved-2026'},{policy:'week10-owner-approved-2026',week:11},{policy:'__proto__'}])
  assert.throws(()=>approvedPreviewRelease({...definition,current},read),/POLICY_UNSUPPORTED/);
});
test('missing or ambiguous historical scope fails closed',()=>{
 for(const historical of [[],[definition.current],[...definition.historical,...definition.historical]])
  assert.throws(()=>approvedPreviewRelease({...definition,historical},read),/HISTORY_INVALID/);
});
test('partial, cross-league, wrong-week or changed originals/scripts cannot be selected',()=>{
 for(const mutate of [rows=>rows.pop(),rows=>rows[0].edition='doge',rows=>rows[0].week=11,rows=>rows[0].sourceSha256='other',rows=>rows[0].scriptSha256='other']){
  const source=read('data/week10-approved-homepage-media.json');mutate(source);
  assert.throws(()=>approvedPreviewRelease(definition,p=>p==='data/week10-approved-homepage-media.json'?source:read(p)),/COHORT_INVALID/);
 }
});
test('missing evidence never silently falls back to an older homepage cohort',()=>{
 for(const file of ['qa/week10-publication-authority.json','data/week10-approved-homepage-media.json','qa/week9-owner-playback-waiver.json'])
  assert.throws(()=>approvedPreviewRelease(definition,p=>p===file?undefined:read(p)));
});
test('both homepages and verifier use the shared definition and sparse checkout includes dependencies',()=>{
 for(const file of ['app/page.js','app/components/editions/Home.js'])assert.match(fs.readFileSync(file,'utf8'),/currentPreviewRelease/);
 assert.match(fs.readFileSync('scripts/operations/verify-hosted-week9-media.mjs','utf8'),/loadApprovedPreviewRelease\(\)/);
 const workflow=fs.readFileSync('.github/workflows/promote-verified-production.yml','utf8');
 for(const p of ['lib/approved-preview-release.mjs','data/active-preview-release.json','scripts/operations/archive-week-control.mjs'])assert.ok(workflow.includes('/'+p));
});

test('a future registered week must preserve both Week9 and Week10 verification',()=>{
 assert.doesNotThrow(()=>validateReleaseHistory(11,[9,10],[9,10,11]));
 for(const history of [[9],[10],[],[9,10,10],[9,10,11]])
  assert.throws(()=>validateReleaseHistory(11,history,[9,10,11]),/HISTORY_INVALID/);
});
test('server release loader has no dynamic runtime filesystem dependency',()=>{
 const source=fs.readFileSync('lib/approved-preview-release.mjs','utf8');
 assert.doesNotMatch(source,/readFileSync|process\.cwd|node:fs|node:path/);
 for(const file of ['active-preview-release.json','week9-approved-homepage-media.json','week10-approved-homepage-media.json','week9-owner-playback-waiver.json','week10-publication-authority.json'])
  assert.ok(source.includes(file+"' with {type:'json'}"));
});
