import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {selectWeek8RecapCohort} from '../lib/week8-recap-cohort.mjs';
import {binding} from '../scripts/operations/prepare-media.mjs';
import {latestWatchWeek} from '../lib/latest-watch-week.mjs';
import {assertWeek8RecapApprovedBinding,recapPlaybackAttestation,week8RecapWaiverId} from '../scripts/operations/week8-recap-playback-waiver.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const authority=read('qa/week8-recap-owner-playback-waiver.json'),manifest=read('data/week8-recap-approved-homepage-media.json');
const hash=b=>createHash('sha256').update(b).digest('hex');
const exact=a=>({registryId:a.registryId,edition:a.matchupKey.split('-2026-')[0],season:2026,week:8,kind:'recap',pair:a.matchupKey.split('-recap-')[1].split('-'),matchupKey:a.matchupKey,writer:a.writer,scriptRevision:a.scriptRevision,scriptSha256:a.scriptSha256,sourceRevision:a.sourcePackageSha256,videoId:a.videoId,voiceId:a.voiceId,avatarId:a.avatarId,sourceAudioSha256:a.sourceAudioSha256,identity:{sha256:a.sourceVideoSha256,bytes:a.sourceVideoBytes,gitBlobSha:a.sourceVideoGitBlobSha}});
test('exact complete eighteen-video recap batch selects six per edition and preserves preview IDs',()=>{
 assert.equal(manifest.length,18);assert.equal(authority.assets.length,18);
 for(const edition of ['loog','doge','sunday-crew'])assert.equal(selectWeek8RecapCohort(manifest,edition,authority).length,6);
 const previewIds=new Set(read('data/week8-approved-homepage-media.json').map(r=>r.id));
 for(const a of authority.assets){assert.ok(!previewIds.has(a.videoId));assert.equal(hash(a.script),a.scriptSha256);assert.equal(hash(a.renderScript),a.renderScriptSha256);assertWeek8RecapApprovedBinding(exact(a));assert.deepEqual(recapPlaybackAttestation(exact(a),week8RecapWaiverId),{qaStatus:'technical_pass_owner_playback_waiver',playbackExceptionId:week8RecapWaiverId,playbackWaiverSourceMessageId:authority.sourceMessageId,fullPlaybackInspection:false,independentAuditoryListening:false,performanceApproval:false});}
});
test('any missing, held, forged, wrong-source or wrong-kind recap hides the whole turnover',()=>{
 for(const input of [undefined,null,{},[],manifest.slice(1),[...manifest,manifest[0]]])assert.deepEqual(selectWeek8RecapCohort(input,'loog',authority),[]);
 for(const mutate of [r=>r.id='0'.repeat(32),r=>r.kind='preview',r=>r.sourceRevision++,r=>r.writer='wrong',r=>r.scriptSha256='f'.repeat(64),r=>r.renderScriptSha256='f'.repeat(64),r=>r.sourcePackageSha256='f'.repeat(64),r=>r.sourceVideoSha256='f'.repeat(64),r=>r.voiceId='wrong',r=>r.avatarId='wrong',r=>r.sourceAudioSha256='f'.repeat(64),r=>r.publicationApproved=false,r=>r.technicalQaPassed=false,r=>r.durationSeconds++,r=>r.fullPlaybackInspection=true,r=>r.independentAuditoryListening=true,r=>r.performanceApproval=true,r=>r.playbackExceptionId='week8-2026-v2-owner-playback-waiver']){
  const rows=structuredClone(manifest);mutate(rows[0]);for(const edition of ['loog','doge','sunday-crew'])assert.deepEqual(selectWeek8RecapCohort(rows,edition,authority),[]);
 }
 const held=structuredClone(authority);held.assets[0].hold='pending';assert.deepEqual(selectWeek8RecapCohort(manifest,'loog',held),[]);
});
test('exact waiver cannot authorize other original bytes, script, voice, avatar or audio',()=>{
 const a=authority.assets[0];
 for(const mutate of [b=>b.kind='preview',b=>b.videoId='0'.repeat(32),b=>b.scriptRevision++,b=>b.scriptSha256='f'.repeat(64),b=>b.sourceRevision='f'.repeat(64),b=>b.sourceAudioSha256='f'.repeat(64),b=>b.voiceId='other',b=>b.avatarId='other',b=>b.identity.bytes++,b=>b.identity.sha256='f'.repeat(64),b=>b.identity.gitBlobSha='f'.repeat(40)]){const b=exact(a);mutate(b);assert.throws(()=>assertWeek8RecapApprovedBinding(b),/mismatch/);}
 assert.throws(()=>recapPlaybackAttestation(exact(a),'week8-2026-v2-owner-playback-waiver'),/Unknown/);
});
test('lossless restored originals and HLS package files match final authority and transport inventory',()=>{
 const source=read('media-sources/week8-recap/manifest.json');assert.equal(source.originals.length,18);
 for(const a of authority.assets){const bytes=fs.readFileSync(`public/reels/${a.videoId}.mp4`);assert.equal(bytes.length,a.sourceVideoBytes);assert.equal(hash(bytes),a.sourceVideoSha256);const row=source.originals.find(r=>r.videoId===a.videoId);assert.equal(row.sha256,a.sourceVideoSha256);}
 for(const f of source.hlsBundle.files){const bytes=fs.readFileSync(f.path);assert.equal(bytes.length,f.bytes);assert.equal(hash(bytes),f.sha256);}
});
test('recap takes home priority while previews and Week 7 remain in the watch archive',()=>{
 for(const file of ['app/page.js','app/components/editions/Home.js']){const s=fs.readFileSync(file,'utf8');assert.ok(s.indexOf('<ReelsShelf reels={currentRecapReels}')<s.indexOf('<ReelsShelf reels={previewReels}'));assert.match(s,/currentRecapReels.length!==6&&previewReels.length===6/);assert.match(s,/week8-recap-viewed-v1/);}
 const archive=fs.readFileSync('lib/watch-library.js','utf8');for(const name of ['week8RecapRows(edition)','week8PreviewRows(edition)','...recaps.filter','...previews.filter'])assert.ok(archive.includes(name));
 assert.deepEqual(latestWatchWeek([{season:2025,week:17},{season:2026,week:7},{season:2026,week:8}]),{season:'2026',week:'8'});
});

test('coordinated changes to render text and both provider hashes cannot reuse exact authority',()=>{
 const a=authority.assets[0],b=exact(a);
 const row={id:a.registryId,writer_slug:a.writer,metadata:{edition:b.edition,kind:'recap',season:2026,week:8,matchupTeamIds:b.pair,matchupKey:b.matchupKey,scriptRevision:a.scriptRevision,scriptSha256:a.scriptSha256,sourcePackageSha256:a.sourcePackageSha256,scriptApproved:true,approvalStatus:'exact_script_approved',voiceId:a.voiceId,renderScript:a.renderScript,renderScriptSha256:a.renderScriptSha256,canonicalRenderBinding:{avatarId:a.avatarId},audioGeneration:{scriptSha256:a.scriptSha256,sourcePackageSha256:a.sourcePackageSha256,voiceId:a.voiceId,renderScriptSha256:a.renderScriptSha256,sha256:a.sourceAudioSha256},videoGeneration:{status:'completed',videoId:a.videoId,scriptSha256:a.scriptSha256,sourcePackageSha256:a.sourcePackageSha256,voiceId:a.voiceId,avatarId:a.avatarId,renderScriptSha256:a.renderScriptSha256,sourceAudioSha256:a.sourceAudioSha256}}};
 assert.deepEqual(binding(row,b.identity),b);
 const m=row.metadata;m.renderScript='Unapproved replacement narration';m.renderScriptSha256=hash(m.renderScript);m.audioGeneration.renderScriptSha256=m.renderScriptSha256;m.videoGeneration.renderScriptSha256=m.renderScriptSha256;
 assert.throws(()=>binding(row,b.identity),/exact approved authority/);
});
