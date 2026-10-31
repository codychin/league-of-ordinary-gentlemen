import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectWeek8PreviewCohort} from '../lib/week8-preview-cohort.mjs';
const realAuthority=JSON.parse(fs.readFileSync('qa/week8-owner-playback-waiver.json','utf8'));

// Synthetic presentation inputs stay in this unit test, never a release manifest.
function fixture(edition='sunday-crew') {
  const authority=structuredClone(realAuthority);
  authority.assets.forEach(a=>a.hold=null);
  const rows=authority.assets.filter(a=>a.matchupKey.startsWith(`${edition}-`)).map((a,i)=>({
    edition,season:2026,week:8,kind:'preview',sourceRevision:a.scriptRevision??2,teamIds:a.matchupKey.split('-preview-')[1].split('-'),
    id:(edition==='loog'?'a':edition==='doge'?'b':'c')+String(i).padStart(31,'0'),
    scriptRegistryId:a.registryId,matchupKey:a.matchupKey,writer:a.writer,scriptSha256:a.scriptSha256,
    sourcePackageSha256:a.sourcePackageSha256,sourceSha256:'1'.repeat(64),sourceVideoSha256:'1'.repeat(64),
    voiceId:'TEST ONLY',publicationApproved:true,approvalSource:'TEST ONLY',technicalQaPassed:true,durationSeconds:30,
    qaStatus:'technical_pass_owner_playback_waiver',playbackExceptionId:authority.exceptionId,
    playbackWaiverSourceMessageId:authority.sourceMessageId,fullPlaybackInspection:false,independentAuditoryListening:false,
    performanceApproval:false,short:'TEST ONLY',matchup:'TEST ONLY',left:'1',right:'2'
  }));
  return {authority,rows};
}
test('absent, empty, malformed, partial and explicitly held editions render no preview shelf',()=>{
  const {authority,rows}=fixture();
  for(const input of [undefined,null,{},[],rows.slice(1),[...rows,rows[0]]])
    assert.deepEqual(selectWeek8PreviewCohort(input,'sunday-crew',authority),[]);
  const held=structuredClone(authority);
  held.assets.find(a=>a.matchupKey.startsWith('sunday-crew-')).hold='Test pending correction';
  assert.deepEqual(selectWeek8PreviewCohort(rows,'sunday-crew',held),[]);
  assert.deepEqual(selectWeek8PreviewCohort(rows,'unknown',authority),[]);
});
test('complete verified cohorts render independently without exposing another incomplete edition',()=>{
  const {authority,rows}=fixture(),loog=fixture('loog').rows;
  const manifest=[...rows,...loog.slice(1)];
  assert.deepEqual(selectWeek8PreviewCohort(manifest,'sunday-crew',authority),rows);
  assert.deepEqual(selectWeek8PreviewCohort(manifest,'loog',authority),[]);
  assert.deepEqual(selectWeek8PreviewCohort([...rows,...loog],'loog',authority),loog);
  assert.ok(rows.every(r=>r.fullPlaybackInspection===false));
});
test('tampered identity, cross-edition media, unverified QA and false playback attestations hide the whole edition',()=>{
  for(const mutate of [
    r=>r[0].scriptRegistryId='other',r=>r[0].scriptSha256='0'.repeat(64),r=>r[0].sourcePackageSha256='0'.repeat(64),
    r=>r[0].sourceVideoSha256='0'.repeat(64),r=>r[0].writer='other',r=>r[0].week=7,r=>r[0].kind='recap',
    r=>r[0].technicalQaPassed=false,r=>r[0].publicationApproved=false,r=>r[0].approvalSource='',
    r=>r[0].durationSeconds=0,r=>r[0].voiceId=null,r=>r[0].teamIds=['1','5'],
    r=>r[0].videoUrl='https://example.invalid/temporary.mp4',r=>r[0].playbackExceptionId='other',
    r=>r[0].fullPlaybackInspection=true,r=>r[0].performanceApproval=true,r=>r[0].independentAuditoryListening=true,
    r=>r[0].id=r[1].id,r=>r.push({...r[0],edition:'doge'})
  ]){
    const {authority,rows}=fixture();mutate(rows);
    assert.deepEqual(selectWeek8PreviewCohort(rows,'sunday-crew',authority),[]);
  }
});
test('actual complete reviews remain distinguishable from waived personal playback',()=>{
  const {authority,rows}=fixture();
  rows.forEach(r=>Object.assign(r,{qaStatus:'media_qa_passed',fullPlaybackInspection:true,independentAuditoryListening:true,performanceApproval:true}));
  assert.equal(selectWeek8PreviewCohort(rows,'sunday-crew',authority).length,6);
});
test('all homepage shelves put gated previews above unchanged recap shelves with separate viewing state',()=>{
  for(const file of ['app/page.js','app/components/editions/Home.js']) {
    const source=fs.readFileSync(file,'utf8');
    const preview=source.indexOf('<ReelsShelf reels={previewReels}');
    const recap=source.indexOf(file==='app/page.js'?'<ReelsShelf reels={publishedReels}':'<ReelsShelf reels={reels}');
    assert.ok(preview>0&&recap>preview);
    assert.match(source,/previewReels.length===6/);
    assert.match(source,/week8-preview-viewed-v2/);
    assert.match(source,/mediaKind="preview" autoOpenFromQuery=\{false\}/);
  }
  const consumer=fs.readFileSync('lib/week8-reels.js','utf8');
  assert.match(consumer,/selectWeek8PreviewCohort/);
  assert.match(consumer,/catch \{return \[\];\}/);
});

test('assembled production manifest has exactly six verified previews per edition',()=>{
  const manifest=JSON.parse(fs.readFileSync('data/week8-approved-homepage-media.json','utf8'));
  assert.equal(manifest.length,18);
  for(const edition of ['loog','doge','sunday-crew'])assert.equal(selectWeek8PreviewCohort(manifest,edition,realAuthority).length,6);
  assert.equal(new Set(manifest.map(r=>r.id)).size,18);
  assert.ok(manifest.every(r=>r.fullPlaybackInspection===false&&r.independentAuditoryListening===false));
});
