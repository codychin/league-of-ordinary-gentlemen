const hash=/^[a-f0-9]{64}$/;
const videoId=/^[a-f0-9]{32}$/;

// Missing, malformed, partial or held editions have no visible shelf.
// Publication is established by assembly/release gates, never by this selector.
export function selectWeek8PreviewCohort(manifest,edition,authority) {
  if(!Array.isArray(manifest) || !['loog','doge','sunday-crew'].includes(edition))return [];
  const expected=authority?.assets?.filter(a=>a.matchupKey.startsWith(`${edition}-2026-week8-preview-`));
  const rows=manifest.filter(r=>r?.edition===edition);
  if(expected?.length!==6 || expected.some(a=>a.hold) || rows.length!==6 ||
    new Set(rows.map(r=>r.matchupKey)).size!==6 || new Set(rows.map(r=>r.id)).size!==6)return [];
  const valid=rows.every(r=>{
    const a=expected.find(a=>a.registryId===r.scriptRegistryId && a.matchupKey===r.matchupKey);
    if(!a || !Array.isArray(r.teamIds) || r.teamIds.length!==2)return false;
    const pair=r.teamIds.map(String).sort((a,b)=>Number(a)-Number(b));
    const performed=r.qaStatus==='media_qa_passed' && r.fullPlaybackInspection===true &&
      r.independentAuditoryListening===true && r.performanceApproval===true;
    const waived=r.qaStatus==='technical_pass_owner_playback_waiver' && r.playbackExceptionId===authority.exceptionId &&
      r.playbackWaiverSourceMessageId===authority.sourceMessageId && r.fullPlaybackInspection===false &&
      r.independentAuditoryListening===false && r.performanceApproval===false;
    return r.season===2026 && r.week===8 && r.kind==='preview' && r.sourceRevision===(a.scriptRevision??2) &&
      r.matchupKey===`${edition}-2026-week8-preview-${pair.join('-')}` && r.writer===a.writer &&
      r.scriptSha256===a.scriptSha256 && r.sourcePackageSha256===a.sourcePackageSha256 &&
      r.publicationApproved===true && typeof r.approvalSource==='string' && r.approvalSource.length>0 &&
      r.technicalQaPassed===true && Number.isFinite(r.durationSeconds) && r.durationSeconds>0 &&
      videoId.test(r.id) && hash.test(r.sourceSha256) && r.sourceVideoSha256===r.sourceSha256 &&
      typeof r.voiceId==='string' && r.voiceId.length>0 && !r.videoUrl && (performed||waived) &&
      ['short','matchup','left','right'].every(k=>typeof r[k]==='string' && r[k].length>0) &&
      manifest.filter(other=>other?.id===r.id).length===1;
  });
  if(!valid || new Set(rows.flatMap(r=>r.teamIds.map(String))).size!==12)return [];
  return rows;
}
