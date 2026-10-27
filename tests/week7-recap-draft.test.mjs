import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateWeek7RecapDraft,validateWeek7RecapMediaBatch} from '../scripts/operations/validate-week7-recap-draft.mjs';
import {selectMatchupColumn} from '../lib/select-matchup-column.mjs';
const packet=JSON.parse(readFileSync('qa/week7-recap-draft.json','utf8'));
// Rejected predecessor hashes are negative regression fixtures only.
const rejectedScriptHashes={
  "doge-2026-week7-recap-1-6": "e133f787aece4263fd3e0ff3de89fc3352c3f231246332c6b98c31abcb6a4d63",
  "doge-2026-week7-recap-2-7": "1d9cb1958f98cee522928c2c35cb631c40bc9469a9d6081dbc882e9650688378",
  "doge-2026-week7-recap-3-8": "ceaf9edaa45917d547b65ec2c3ad840033739516413db99e93442ce384142722",
  "doge-2026-week7-recap-4-12": "c24a2e1a4bcf8afdf39c51d7b501f5f26a0eb4453ee2dfd8714520e04d98cdb9",
  "doge-2026-week7-recap-5-10": "1f15324917a34b5b1fe48bd2a11315fe186c1e166dcb50f09ef4bf476fe5f217",
  "doge-2026-week7-recap-9-11": "bed6a19b494c3e7a7e554cf2e9e9a3f0c110c1888d30490673827a1dd7fb2288",
  "loog-2026-week7-recap-1-6": "51dc20b03aee3feb13ee3bfd448b7c38ebc076af303a6e91c347ff03462b58be",
  "loog-2026-week7-recap-2-5": "22689a20344998ca1ae408b11d99a74a057fd763b1cfe7c7adf0f3dda3ede1f8",
  "loog-2026-week7-recap-3-8": "3c911c076b8fb30eea1a68bfd4df5a045530c81c764b8b41998dedb171c9f15a",
  "loog-2026-week7-recap-4-10": "7e0471a6c19c00a6df02a6ba269a584cf4bd021d7f56d5011c734b8418a5c399",
  "loog-2026-week7-recap-7-12": "1c0bbe48cea2945aae2af07de2354eb3afda772e4144507b477cc5a258aec100",
  "loog-2026-week7-recap-9-11": "c62ade7e781cd45aad5935af24a287b3f4487c345e79cb3bc205fb930ffe38d8",
  "sunday-crew-2026-week7-recap-1-8": "856dd3bf7f2ec7bf2ce562260b48c25d2cc27df998f80ce3f905a0415e5a0924",
  "sunday-crew-2026-week7-recap-2-10": "e9acf8e448358325d6bfda7cb16dedcd5e5d6d9eb0cd693b7916526597984739",
  "sunday-crew-2026-week7-recap-3-4": "30ad63350dabba05aa5b1a268a76124bbdf88a9ebcb06de650b823760a419734",
  "sunday-crew-2026-week7-recap-5-12": "6ec07b6e823097af8f9c270a2ffbce431d2b7af68c7f6ba4a6692f0cf424e94e",
  "sunday-crew-2026-week7-recap-6-9": "827feef1495846f9d405e8afb6fce1bdfae8a957cb924c83b01a27ad452fc990",
  "sunday-crew-2026-week7-recap-7-11": "2deac7ed1a7446da899ea433a2efda4e7a91cd0c9b3d8c56c56c6990d4dd6c85"
};
test('all 18 rejected predecessor hashes fail the staged packet and media gate',()=>{
  for (const entry of packet.entries) {
    const rejected=rejectedScriptHashes[entry.matchupKey];
    assert.notEqual(entry.scriptSha256,rejected);
    const changed=structuredClone(packet);
    changed.entries.find(r=>r.matchupKey===entry.matchupKey).scriptSha256=rejected;
    assert.throws(()=>validateWeek7RecapDraft(changed));
    const media=mediaFixture(entry.edition);
    media.find(r=>r.teamIds.join('-')===entry.teamIds.join('-')).scriptSha256=rejected;
    assert.throws(()=>validateWeek7RecapMediaBatch(packet,entry.edition,media));
  }
});

// Synthetic metadata only: these are not assets, approvals, or publication evidence.
const mediaFixture=edition=>packet.entries.filter(r=>r.edition===edition).map((r,i)=>({
  id:String(i+1).padStart(32,'0'),edition,season:2026,week:7,kind:'recap',teamIds:r.teamIds,
  scriptSha256:r.scriptSha256,sourceRevision:r.scriptRevision,writer:r.writer,
  qaStatus:'media_qa_passed',approvalSource:'synthetic test fixture',voiceId:'fixture',
}));
const ownerException=JSON.parse(readFileSync('qa/week7-owner-playback-exception.json','utf8'));
const exceptionFixture=edition=>mediaFixture(edition).map(item=>{
  const key=`${edition}-2026-week7-recap-${item.teamIds.join('-')}`;
  const original=ownerException.assets.find(a=>a.matchupKey===key);
  return {...item,id:original.videoId,sourceSha256:original.sourceSha256,
    ...(original.sourceAudio?{sourceAudio:structuredClone(original.sourceAudio),voiceId:original.voiceId}:{}),
    qaStatus:'technical_pass_owner_playback_exception',playbackExceptionId:ownerException.exceptionId,
    publicationApproved:true,fullPlaybackInspection:false,independentAuditoryListening:false,
    performanceApproval:false,durationSeconds:20,
    technicalChecks:Object.fromEntries(['sourceBytesVerified','videoDecodePass','audioDecodePass','packageValidated','posterVerified','aspectVerified','sampledVisualChecksPass','lexicalChecksPass'].map(k=>[k,true]))};
});
test('owner playback exception is restricted to the exact 18 originals and approved scripts',()=>{
  assert.equal(ownerException.assets.length,18);
  assert.equal(new Set(ownerException.assets.map(a=>a.videoId)).size,18);
  for (const edition of ['loog','sunday-crew','doge']) {
    const media=exceptionFixture(edition);
    assert.equal(validateWeek7RecapMediaBatch(packet,edition,media),media);
    for (const original of ownerException.assets.filter(a=>a.matchupKey.startsWith(edition+'-')))
      assert.equal(original.scriptSha256,packet.entries.find(e=>e.matchupKey===original.matchupKey).scriptSha256);
    for (const change of [
      m=>m[0].id='f'.repeat(32),m=>m[0].sourceSha256='f'.repeat(64),
      m=>m[0].playbackExceptionId='future-batch',m=>m[0].publicationApproved=false,
      m=>m[0].fullPlaybackInspection=true,m=>m[0].independentAuditoryListening=true,
      m=>m[0].performanceApproval=true,m=>m[0].durationSeconds=0,
      m=>m[0].week=8,m=>m[0].sourceRevision='replacement',m=>m.pop(),
      ...Object.keys(media[0].technicalChecks).map(k=>m=>m[0].technicalChecks[k]=false),
    ]) {
      const changed=structuredClone(media);change(changed);
      assert.throws(()=>validateWeek7RecapMediaBatch(packet,edition,changed));
    }
  }
});
test('supplied-audio original uses its exact immutable audio provenance without inventing a voice ID',()=>{
 const media=exceptionFixture('loog');
 const item=media.find(r=>r.teamIds.join('-')==='2-5');
 item.voiceId=null;
 item.sourceAudio=structuredClone(ownerException.assets.find(a=>a.matchupKey==='loog-2026-week7-recap-2-5').sourceAudio);
 assert.equal(validateWeek7RecapMediaBatch(packet,'loog',media),media);
 for(const key of Object.keys(item.sourceAudio)){
  const changed=structuredClone(media);changed.find(r=>r.teamIds.join('-')==='2-5').sourceAudio[key]='wrong';
  assert.throws(()=>validateWeek7RecapMediaBatch(packet,'loog',changed));
 }
 const missing=structuredClone(media);delete missing.find(r=>r.teamIds.join('-')==='2-5').sourceAudio;
 assert.throws(()=>validateWeek7RecapMediaBatch(packet,'loog',missing));
 const unrelated=structuredClone(media);unrelated.find(r=>r.teamIds.join('-')!=='2-5').voiceId=null;
 assert.throws(()=>validateWeek7RecapMediaBatch(packet,'loog',unrelated));
});
for (const edition of ['loog','sunday-crew','doge']) test(`${edition} media gate accepts only a complete matching six-video batch`,()=>{
  const media=mediaFixture(edition);
  assert.equal(validateWeek7RecapMediaBatch(packet,edition,media),media);
  for (let n=0;n<6;n++) assert.throws(()=>validateWeek7RecapMediaBatch(packet,edition,media.slice(0,n)));
  for (const change of [
    m=>m[0].edition='wrong-league',m=>m[0].scriptSha256='wrong-script',
    m=>m[0].qaStatus='pending',m=>m[0].kind='preview',m=>m[0].id=m[1].id,
    m=>m[0].sourceRevision='old-revision',m=>m[0].videoUrl='https://example.invalid/temporary.mp4',
  ]) { const changed=structuredClone(media);change(changed);assert.throws(()=>validateWeek7RecapMediaBatch(packet,edition,changed)); }
});

test('all 18 saved recaps and scripts retain exact hashes, revisions, identities and pairings',()=>{
  assert.deepEqual(validateWeek7RecapDraft(packet),{articles:18,scripts:18,releaseReady:false});
});
for (const [label,change] of [
  ['cross-league identity',p=>p.entries[0].leagueId=p.entries.find(r=>r.edition==='loog').leagueId],
  ['missing matchup',p=>p.entries.pop()],
  ['duplicate pairing',p=>p.entries[1]=structuredClone(p.entries[0])],
  ['changed prose',p=>p.entries[0].paragraphs[0]+=' Changed.'],
  ['collapsed paragraphs',p=>p.entries[0].paragraphs=[p.entries[0].paragraphs.join(' ')]],
  ['changed script',p=>p.entries[0].script+=' Changed.'],
  ['self-consistent unapproved script',p=>{p.entries[0].script+=' Changed.';p.entries[0].scriptSha256=createHash('sha256').update(p.entries[0].script).digest('hex');}],
  ['rejected script revision',p=>p.entries[0].scriptRevision=p.entries[0].revision],
  ['missing exact approval',p=>p.entries[0].scriptApproved=false],
  ['signed asset URL',p=>p.entries[0].audioUrl='https://example.invalid/private?signature=fixture'],
  ['budget details',p=>p.entries[0].budgetContext={amount:1}],
  ['private transcript',p=>p.entries[0].approvalTranscript='private fixture'],
  ['internal checkpoint path',p=>p.entries[0].sourceCaptureManifest.checkpointFile='/workspace/private/fixture.json'],
  ['premature publication',p=>p.publicationApproved=true],
  ['unreviewed media',p=>p.media.push({id:'placeholder'})],
]) test(`draft validation rejects ${label}`,()=>{
  const changed=structuredClone(packet);change(changed);
  assert.throws(()=>validateWeek7RecapDraft(changed));
});

test('prepared recaps preserve the exact approved bodies and route by finality and league',()=>{
  const recaps=JSON.parse(readFileSync('data/matchup-recaps.json','utf8'));
  for (const r of packet.entries) {
    const [a,b]=r.teamIds;
    const args={recaps,edition:r.edition,season:2026,week:7,a,b,isFinal:true};
    const selected=selectMatchupColumn(args);
    assert.equal(selected.body,r.paragraphs.join('\n\n'));
    assert.equal(selected.headline,r.headline);
    assert.equal(selected.writer,r.writer);
    assert.equal(selected.source.leagueId,r.leagueId);
    assert.equal(selected.source.bodySha256,r.bodySha256);
    assert.equal(selected.source.status,'FINAL');
    assert.equal(selectMatchupColumn({...args,a:b,b:a}),selected);
    assert.equal(selectMatchupColumn({...args,isFinal:false}),null);
    assert.equal(selectMatchupColumn({...args,season:2027}),null);
  }
  for (const path of ['app/page.js','lib/week7-reels.js','lib/edition-content.js'])
    assert.ok(!readFileSync(path,'utf8').includes('week7-recap-draft'));
});

test('existing page placement preserves text paragraphs and excludes recap videos and scores-overview copy',()=>{
  for (const path of ['app/matchups/[a]/[b]/page.js','app/components/editions/Matchup.js']) {
    const source=readFileSync(path,'utf8');
    assert.ok(!source.includes('<video'));
    assert.ok(source.includes('.map((paragraph,index)=><p'));
  }
  for (const path of ['app/components/LiveWeek3Surfaces.jsx','app/components/EditionScoreboard.jsx'])
    assert.ok(!readFileSync(path,'utf8').includes('CompletedScoresSummary'));
});
