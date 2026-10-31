import fs from 'node:fs';
import {createHash} from 'node:crypto';
const authority=JSON.parse(fs.readFileSync(new URL('../../qa/week8-owner-playback-waiver.json',import.meta.url),'utf8'));
const need=(ok,message)=>{if(!ok)throw Error(message);};
export const week8WaiverId=authority.exceptionId;
export function assertWeek8ApprovedBinding(b) {
  const a=authority.assets.find(a=>a.registryId===b.registryId);
  need(a && !a.hold,'Week 8 exact script missing or held for correction approval');
  need(b.season===2026 && b.week===8 && b.kind==='preview' && b.scriptRevision===2 &&
    b.matchupKey===a.matchupKey && b.matchupKey===`${b.edition}-2026-week8-preview-${b.pair.join('-')}` &&
    b.writer===a.writer && b.scriptSha256===a.scriptSha256 && b.sourceRevision===a.sourcePackageSha256 &&
    createHash('sha256').update(a.script).digest('hex')===a.scriptSha256,'Week 8 exact approved script/source binding mismatch');
  return a;
}
export function playbackAttestation(b,review,waiverId) {
  if(waiverId!=null) {
    need(waiverId===authority.exceptionId,'Unknown owner playback waiver');
    assertWeek8ApprovedBinding(b);
  }
  const performed=review?.status==='passed' && review.fullAuditoryReviewPerformed===true &&
    review.fullMotionReviewPerformed===true && review.performanceApproval===true && review.reviewer && review.evidence;
  if(performed)return {qaStatus:'media_qa_passed',fullPlaybackInspection:true,independentAuditoryListening:true,performanceApproval:true};
  need(waiverId===authority.exceptionId,'Full auditory/motion review required; Week 7 exception is not reusable');
  // A waiver is publication authority, never evidence that listening or playback occurred.
  return {qaStatus:'technical_pass_owner_playback_waiver',playbackExceptionId:authority.exceptionId,
    playbackWaiverSourceMessageId:authority.sourceMessageId,
    fullPlaybackInspection:false,independentAuditoryListening:false,performanceApproval:false};
}
