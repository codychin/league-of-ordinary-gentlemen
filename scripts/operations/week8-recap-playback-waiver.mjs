import fs from 'node:fs';
import {createHash} from 'node:crypto';

export const week8RecapWaiverId='week8-2026-recap-owner-playback-waiver-20261104';
const need=(ok,message)=>{if(!ok)throw Error(message);};
const digest=text=>createHash('sha256').update(text).digest('hex');

// Load only when this exact recap batch is requested. Preview/history modules do
// not acquire recap authority merely by importing the preparation helpers.
export function recapAuthority() {
  const authority=JSON.parse(fs.readFileSync(new URL('../../qa/week8-recap-owner-playback-waiver.json',import.meta.url),'utf8'));
  need(authority.exceptionId===week8RecapWaiverId && authority.assets?.length===18 &&
    new Set(authority.assets.map(a=>a.registryId)).size===18 &&
    new Set(authority.assets.map(a=>a.videoId)).size===18,'Exact eighteen-video recap authority required');
  return authority;
}

export function assertWeek8RecapRenderScript(registryId,renderScriptSha256) {
  const a=recapAuthority().assets.find(a=>a.registryId===registryId);
  need(a && !a.hold && renderScriptSha256===a.renderScriptSha256 && digest(a.renderScript)===renderScriptSha256,
    'Week 8 recap render text differs from exact approved authority');
}

export function assertWeek8RecapApprovedBinding(b) {
  const authority=recapAuthority(),a=authority.assets.find(a=>a.registryId===b.registryId);
  need(a && !a.hold,'Week 8 recap binding missing or held');
  need(b.season===2026 && b.week===8 && b.kind==='recap' && b.scriptRevision===a.scriptRevision &&
    b.matchupKey===a.matchupKey && b.matchupKey===`${b.edition}-2026-week8-recap-${b.pair.join('-')}` &&
    b.writer===a.writer && b.scriptSha256===a.scriptSha256 && b.sourceRevision===a.sourcePackageSha256 &&
    b.videoId===a.videoId && b.voiceId===a.voiceId && b.avatarId===a.avatarId &&
    b.sourceAudioSha256===a.sourceAudioSha256 && b.identity?.sha256===a.sourceVideoSha256 &&
    b.identity?.bytes===a.sourceVideoBytes && b.identity?.gitBlobSha===a.sourceVideoGitBlobSha &&
    digest(a.script)===a.scriptSha256 && digest(a.renderScript)===a.renderScriptSha256,
    'Week 8 recap exact script/source/audio/video binding mismatch');
  return a;
}

export function recapPlaybackAttestation(b,waiverId) {
  need(waiverId===week8RecapWaiverId,'Unknown recap playback waiver');
  assertWeek8RecapApprovedBinding(b);
  const authority=recapAuthority();
  // This permission is never evidence that a personal review took place.
  return {qaStatus:'technical_pass_owner_playback_waiver',playbackExceptionId:week8RecapWaiverId,
    playbackWaiverSourceMessageId:authority.sourceMessageId,
    fullPlaybackInspection:false,independentAuditoryListening:false,performanceApproval:false};
}
