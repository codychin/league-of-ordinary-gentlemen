import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Offline draft validation only. This does not establish finality or authorize release.
export const leagues = {
  loog: {id:'65c573a0-535d-4edf-8332-2522ee13872f', revision:'conditional-v4-20261027', pairs:['1-6','2-5','3-8','4-10','7-12','9-11']},
  'sunday-crew': {id:'1146fb6b-b5ea-4981-93c2-790be3b993ab', revision:'conditional-v3-20261027', pairs:['1-8','2-10','3-4','5-12','6-9','7-11']},
  doge: {id:'33707500-ac22-489e-ae65-0c11e2880ffc', revision:'conditional-v3-20261027', pairs:['1-6','2-7','3-8','4-12','5-10','9-11']},
};
const hash = text => createHash('sha256').update(text).digest('hex');
const pair = entry => entry.teamIds.map(Number).sort((a,b)=>a-b).join('-');

// Structural gate for a supplied league batch; audiovisual/staging QA remains mandatory.
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
    assert.equal(item.sourceRevision,entry.revision);
    assert.equal(item.writer,entry.writer);
    assert.equal(item.qaStatus,'media_qa_passed');
    assert.ok(item.approvalSource);
    assert.ok(item.voiceId);
    assert.match(item.id,/^[a-f0-9]{32}$/);
    assert.ok(!item.videoUrl,'Require durable packaged playback');
  }
  return media;
}

export function validateWeek7RecapDraft(packet) {
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
      assert.equal(entry.scriptSlug,`${entry.matchupKey}-script-${entry.revision}`);
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
