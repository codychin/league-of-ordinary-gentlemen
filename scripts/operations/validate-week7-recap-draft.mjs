import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const playbackException=JSON.parse(readFileSync(new URL('../../qa/week7-owner-playback-exception.json',import.meta.url),'utf8'));

// An informed owner exception is a disposition, never a claim that review occurred.
function validateOwnerPlaybackException(item, entry) {
  assert.equal(item.qaStatus,'technical_pass_owner_playback_exception');
  assert.equal(item.playbackExceptionId,playbackException.exceptionId);
  const original=playbackException.assets.find(a=>a.matchupKey===entry.matchupKey);
  assert.ok(original,'Exception applies only to the enumerated original batch');
  assert.equal(item.id,original.videoId);
  assert.equal(item.sourceSha256,original.sourceSha256);
  assert.equal(item.scriptSha256,original.scriptSha256);
  assert.equal(item.sourceRevision,playbackException.scriptRevision);
  if (original.sourceAudio) {
    assert.deepEqual(item.sourceAudio,original.sourceAudio);
    if (item.voiceId) assert.equal(item.voiceId,original.voiceId);
  }
  assert.equal(item.publicationApproved,true);
  for (const key of ['fullPlaybackInspection','independentAuditoryListening','performanceApproval'])
    assert.equal(item[key],false,`${key} was not performed`);
  for (const key of ['sourceBytesVerified','videoDecodePass','audioDecodePass','packageValidated','posterVerified','aspectVerified','sampledVisualChecksPass','lexicalChecksPass'])
    assert.equal(item.technicalChecks?.[key],true,`${key} remains required`);
  assert.ok(Number.isFinite(item.durationSeconds) && item.durationSeconds>0);
}

export const approvedScriptRevision='voice-rewrite-v2-20261027';
// Exact individual hashes verified from the 18 approved registry rows.
// The original manifest hash is provenance, not a reconstructed-byte assertion.
export const approvedScriptHashes=Object.freeze({
  "doge-2026-week7-recap-1-6": "cfc9d67a06ab2d0ba45502e93c2dae9990acf0b88c6ddd322237e46323c44006",
  "doge-2026-week7-recap-2-7": "a39894412f062c3a80d2670cb5856dbee50e43ba5624d496383758745dd05da4",
  "doge-2026-week7-recap-3-8": "301c553552db8dead724f432c7729d243c14b159594cf96fb9e637aaa4e5ed92",
  "doge-2026-week7-recap-4-12": "c623164da85df1c7df6807d5378392d9d221e1ce2914261f4266429e744e8329",
  "doge-2026-week7-recap-5-10": "db59847e4e0145faf4bdcb3b25c6eeb2f79e80529405e0d58554ca5e063b832e",
  "doge-2026-week7-recap-9-11": "650b3e56d1c358ee332c1fb80db9814e9a56c008958aaa6f13598a70ce1a597f",
  "loog-2026-week7-recap-1-6": "3954697d2eb0f7557c054d9e20b9e8c7fb9ace0c479b1fa35749ccc84658003a",
  "loog-2026-week7-recap-2-5": "c8058b42b5a92d29676d8dc15e269c86988f9828d0b915b17b7bd1022d387577",
  "loog-2026-week7-recap-3-8": "125bccd7e81fb6eedaeaf4f4cfb3a47c56ef3b0fd54296970138723e67b57810",
  "loog-2026-week7-recap-4-10": "6e58b1412e386e6223e95fdbda5330cc08f4f889c3481a7ed42bc0ae71ff50a5",
  "loog-2026-week7-recap-7-12": "517645bde8c643d44962093b80201fbc6eabfcdd2c0dafc15e2d02fd532151b6",
  "loog-2026-week7-recap-9-11": "aa18d8069ec9075101681af66a378ee71f7520cbaa48940b5f6c65cdc71e4c81",
  "sunday-crew-2026-week7-recap-1-8": "1cea98580d7b5e447cf509e973445750a0f215fe1613175acba2fbdd29c0e977",
  "sunday-crew-2026-week7-recap-2-10": "4c1c3ca978c1b2483e637f281419d379b341bad7eae46477ea6bd851a19dba1a",
  "sunday-crew-2026-week7-recap-3-4": "92caf440dc99a48753805c8f00fa96c99785b27b69f0a1ff643aa15d10208298",
  "sunday-crew-2026-week7-recap-5-12": "14774a8e68f3c5c03e31af89e222e48118f582cb3b26c3b9ebf81dbbb33c69cd",
  "sunday-crew-2026-week7-recap-6-9": "55baa84201cde1c079f8a5f9c166ad9b14d5c46415f0290a7de5c16f4db51f67",
  "sunday-crew-2026-week7-recap-7-11": "facaa0344b05bc4c111f244adf0fb8a449ecaa2702054de53458dbeb40489aa5"
});

function assertSanitized(value) {
  if (typeof value==='string') assert.doesNotMatch(value,/https?:\/\/|\/(?:workspace|tmp)\//i,'No asset URLs or internal paths in the staged manifest');
  if (value && typeof value==='object') for (const [key,child] of Object.entries(value)) {
    assert.doesNotMatch(key,/(?:url|budget|billing|transcript|note|path|file)/i,'No private production fields in the staged manifest');
    assertSanitized(child);
  }
}

// Offline draft validation only. This does not establish finality or authorize release.
export const leagues = {
  loog: {id:'65c573a0-535d-4edf-8332-2522ee13872f', revision:'conditional-v4-20261027', pairs:['1-6','2-5','3-8','4-10','7-12','9-11']},
  'sunday-crew': {id:'1146fb6b-b5ea-4981-93c2-790be3b993ab', revision:'conditional-v3-20261027', pairs:['1-8','2-10','3-4','5-12','6-9','7-11']},
  doge: {id:'33707500-ac22-489e-ae65-0c11e2880ffc', revision:'conditional-v3-20261027', pairs:['1-6','2-7','3-8','4-12','5-10','9-11']},
};
const hash = text => createHash('sha256').update(text).digest('hex');
const pair = entry => entry.teamIds.map(Number).sort((a,b)=>a-b).join('-');

// Structural gate; the exact owner exception does not waive technical/staging QA.
// Return the complete batch or throw. Never return a partially ready shelf.
export function validateWeek7RecapMediaBatch(packet, edition, media) {
  validateWeek7RecapDraft(packet);
  assert.ok(leagues[edition],'Known edition required');
  assert.equal(media.length,6,'A league requires all six recap videos');
  assert.deepEqual(media.map(pair).sort(),leagues[edition].pairs);
  assert.equal(new Set(media.map(r=>r.id)).size,6);
  for (const item of media) {
    const entry=packet.entries.find(r=>r.edition===edition && pair(r)===pair(item));
    assert.equal(item.edition,edition);
    assert.equal(item.season,2026);
    assert.equal(item.week,7);
    assert.equal(item.kind,'recap');
    assert.equal(item.scriptSha256,entry.scriptSha256);
    assert.equal(item.sourceRevision,entry.scriptRevision);
    assert.equal(item.writer,entry.writer);
    if (item.qaStatus!=='media_qa_passed') validateOwnerPlaybackException(item,entry);
    assert.ok(item.approvalSource);
    if (!item.voiceId) {
      const original=playbackException.assets.find(a=>a.matchupKey===entry.matchupKey);
      assert.equal(item.qaStatus,'technical_pass_owner_playback_exception');
      assert.ok(original?.sourceAudio,'Voice ID or exact original supplied-audio provenance required');
      assert.deepEqual(item.sourceAudio,original.sourceAudio);
    }
    assert.match(item.id,/^[a-f0-9]{32}$/);
    assert.ok(!item.videoUrl,'Require durable packaged playback');
  }
  return media;
}

export function validateWeek7RecapDraft(packet) {
  assertSanitized(packet);
  assert.equal(packet.approvedScriptManifestSha256,'0c172475c7736d1648cc944e49c4cbdcaad9d960c9873697ae77920ad8b39f29');
  assert.equal(packet.schemaVersion,1);
  assert.equal(packet.status,'draft');
  assert.equal(packet.publicationApproved,false);
  assert.deepEqual(packet.media,[],'No media has been supplied or approved for this draft');
  assert.equal(packet.repository,'codychin/league-of-ordinary-gentlemen');
  assert.deepEqual(packet.registry,{projectId:'dnzdbqycuuoonewcowis',table:'brief_publication_articles'});
  assert.equal(packet.season,2026);
  assert.equal(packet.week,7);
  assert.equal(packet.entries.length,18);
  assert.equal(new Set(packet.entries.flatMap(r=>[r.articleRegistryId,r.scriptRegistryId])).size,36);
  for (const [edition,expected] of Object.entries(leagues)) {
    const entries=packet.entries.filter(r=>r.edition===edition);
    assert.deepEqual(entries.map(pair).sort(),expected.pairs);
    assert.equal(new Set(entries.flatMap(r=>r.teamIds.map(String))).size,12);
    for (const entry of entries) {
      assert.equal(entry.leagueId,expected.id,'Canonical league identity');
      assert.equal(entry.teamIds.length,2);
      assert.equal(entry.revision,expected.revision);
      assert.equal(entry.matchupKey,`${edition}-2026-week7-recap-${pair(entry)}`);
      assert.equal(entry.articleSlug,`${entry.matchupKey}-article-${entry.revision}`);
      assert.equal(entry.scriptRevision,approvedScriptRevision);
      assert.equal(entry.scriptSlug,`${entry.matchupKey}-script-${entry.scriptRevision}`);
      assert.equal(entry.scriptApproved,true);
      assert.equal(entry.scriptApprovalStatus,'exact_script_approved');
      assert.equal(entry.scriptSha256,approvedScriptHashes[entry.matchupKey],'Only the exact approved rewrite may pass');
      assert.equal(entry.publicationApproved,false);
      assert.equal(entry.approvalStatus,'rika_editorial_conditional_pending_provider_finality');
      assert.ok(entry.paragraphs.length>=3 && entry.paragraphs.length<=5);
      assert.ok(entry.paragraphs.every(p=>typeof p==='string' && p.trim().length>0));
      assert.equal(hash(entry.paragraphs.join('\n\n')),entry.bodySha256,'Exact paragraph-preserving article hash');
      assert.equal(hash(entry.script),entry.scriptSha256,'Exact render script hash');
      assert.match(entry.sourcePackageSha256,/^[a-f0-9]{64}$/);
      assert.match(entry.sourceCaptureManifest.checkpointSha256,/^[a-f0-9]{64}$/);
      assert.ok(entry.writer && entry.headline);
    }
  }
  return {articles:18,scripts:18,releaseReady:false};
}
