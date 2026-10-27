import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateWeek7RecapDraft,validateWeek7RecapMediaBatch} from '../scripts/operations/validate-week7-recap-draft.mjs';
import {selectMatchupColumn} from '../lib/select-matchup-column.mjs';
const packet=JSON.parse(readFileSync('qa/week7-recap-draft.json','utf8'));

// Synthetic metadata only: these are not assets, approvals, or publication evidence.
const mediaFixture=edition=>packet.entries.filter(r=>r.edition===edition).map((r,i)=>({
  id:String(i+1).padStart(32,'0'),edition,season:2026,week:7,kind:'recap',teamIds:r.teamIds,
  scriptSha256:r.scriptSha256,sourceRevision:r.revision,writer:r.writer,
  qaStatus:'media_qa_passed',approvalSource:'synthetic test fixture',voiceId:'fixture',
}));
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
  ['premature publication',p=>p.publicationApproved=true],
  ['unreviewed media',p=>p.media.push({id:'placeholder'})],
]) test(`draft validation rejects ${label}`,()=>{
  const changed=structuredClone(packet);change(changed);
  assert.throws(()=>validateWeek7RecapDraft(changed));
});

test('draft packet stays outside active content and does not expose conditional recaps',()=>{
  const recaps=JSON.parse(readFileSync('data/matchup-recaps.json','utf8'));
  for (const r of packet.entries) {
    const [a,b]=r.teamIds;
    assert.equal(selectMatchupColumn({recaps,edition:r.edition,season:2026,week:7,a,b,isFinal:true}),null);
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
