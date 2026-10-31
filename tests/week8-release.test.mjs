import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {playbackAttestation,week8WaiverId,assertWeek8ApprovedBinding} from '../scripts/operations/week8-playback-waiver.mjs';
import {selectLoogScores} from '../lib/select-loog-scores.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const authority=read('qa/week8-owner-playback-waiver.json');
const binding=a=>({registryId:a.registryId,matchupKey:a.matchupKey,edition:a.matchupKey.split('-2026')[0],
  season:2026,week:8,kind:'preview',pair:a.matchupKey.split('-preview-')[1].split('-'),writer:a.writer,
  scriptRevision:a.scriptRevision??2,scriptSha256:a.scriptSha256,sourceRevision:a.sourcePackageSha256});
test('waiver binds 18 exact scripts including three approved corrections without claiming playback',()=>{
  assert.equal(authority.assets.length,18);
  assert.equal(new Set(authority.assets.map(a=>a.registryId)).size,18);
  assert.equal(authority.assets.filter(a=>a.hold).length,0);
  assert.equal(authority.assets.filter(a=>a.scriptRevision===3).length,3);
  for(const a of authority.assets){
    assert.equal(createHash('sha256').update(a.script).digest('hex'),a.scriptSha256);
    if(a.hold){assert.throws(()=>playbackAttestation(binding(a),null,week8WaiverId),/held/);continue;}
    const result=playbackAttestation(binding(a),null,week8WaiverId);
    assert.equal(result.fullPlaybackInspection,false);
    assert.equal(result.independentAuditoryListening,false);
    assert.equal(result.performanceApproval,false);
    assert.equal(result.playbackWaiverSourceMessageId,authority.sourceMessageId);
  }
});
test('waiver cannot authorize another script, source, season, writer, edition or old batch',()=>{
  const a=authority.assets.find(a=>!a.hold),b=binding(a);
  for(const [key,value] of Object.entries({registryId:'different',scriptSha256:'f'.repeat(64),sourceRevision:'e'.repeat(64),week:7,season:2027,kind:'recap',writer:'other',edition:'other',scriptRevision:1,pair:['2','3']}))
    assert.throws(()=>assertWeek8ApprovedBinding({...b,[key]:value}));
  assert.throws(()=>playbackAttestation(b,null,'week7-2026-owner-playback-exception'),/Unknown/);
  assert.throws(()=>playbackAttestation(b,null),/review required/);
  const corrected=authority.assets.find(a=>a.scriptRevision===3);
  const superseded={...binding(corrected),scriptRevision:2,scriptSha256:corrected.supersededBinding.scriptSha256,sourceRevision:corrected.supersededBinding.sourcePackageSha256};
  const review={status:'passed',fullAuditoryReviewPerformed:true,fullMotionReviewPerformed:true,performanceApproval:true,reviewer:'fixture',evidence:'fixture'};
  assert.throws(()=>playbackAttestation(superseded,review,week8WaiverId),/binding mismatch/);
  assert.equal(playbackAttestation(b,review).fullPlaybackInspection,true);
});
test('Week 8 fallback preserves twelve current pairings and corroborated actuals, never zero totals or projections',()=>{
  const raw=read('data/week8-loog-score-evidence.json'),latest=read('data/latest-loog-scores.json'),completed=read('data/completed-loog-scores.json');
  assert.equal(completed.week,7);assert.equal(completed.status,'FINAL');
  assert.equal(latest.week,8);assert.equal(latest.provisional,true);
  assert.equal(latest.updatedAt,raw.capturedAt);assert.equal(raw.leagueId,'310731');
  assert.equal(latest.matchups.length,6);
  assert.equal(new Set(latest.matchups.flatMap(g=>[g.home.id,g.away.id])).size,12);
  for(const g of latest.matchups){
    const source=raw.matchups.find(r=>r.home.teamId===g.home.id&&r.away.teamId===g.away.id);
    assert.ok(source);assert.equal(g.winner,'UNDECIDED');assert.equal(g.status,'LIVE');
    for(const side of ['home','away']){
      assert.equal(g[side].score,source[side].currentPoints);
      assert.equal(g[side].score,source[side].pointsByScoringPeriod['8']);
      assert.equal(g[side].projection,source[side].totalProjectedPoints);
      assert.notEqual(g[side].score,g[side].projection);
    }
  }
  const oldProvider={...latest,updatedAt:'2026-10-29T12:00:00Z'};
  assert.equal(selectLoogScores({provider:oldProvider,latest,completed,now:Date.parse('2026-10-31T15:00:00Z')}),latest);
});

test('three corrected bindings retain superseded history and exact correction approval',()=>{
  for(const a of authority.assets.filter(a=>a.scriptRevision===3)){
    assert.equal(a.correctionApproval.sourceMessageId,'Sentinel_b04ee4b7df84819189838e35bbc0aa4a');
    assert.equal(a.correctionApproval.scriptSha256,a.scriptSha256);
    assert.equal(createHash('sha256').update(a.supersededBinding.script).digest('hex'),a.supersededBinding.scriptSha256);
    assert.notEqual(a.scriptSha256,a.supersededBinding.scriptSha256);
    assert.notEqual(a.sourcePackageSha256,a.supersededBinding.sourcePackageSha256);
    assert.throws(()=>assertWeek8ApprovedBinding({...binding(a),scriptRevision:2}));
    assertWeek8ApprovedBinding(binding(a));
  }
});
