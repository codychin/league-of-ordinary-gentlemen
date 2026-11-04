const hash=/^[a-f0-9]{64}$/;
const videoId=/^[a-f0-9]{32}$/;
const waiverId='week8-2026-recap-owner-playback-waiver-20261104';
const editions=['loog','doge','sunday-crew'];

// The requested turnover is one complete batch. An absent, partial, stale or
// tampered manifest keeps the current preview shelf intact.
export function selectWeek8RecapCohort(manifest,edition,authority) {
  if(!Array.isArray(manifest) || manifest.length!==18 || !editions.includes(edition) ||
    authority?.exceptionId!==waiverId || authority.assets?.length!==18 ||
    new Set(authority.assets.map(a=>a.registryId)).size!==18 ||
    new Set(manifest.map(r=>r?.id)).size!==18)return [];
  for(const scope of editions) {
    const rows=manifest.filter(r=>r?.edition===scope);
    const expected=authority.assets.filter(a=>a.matchupKey?.startsWith(`${scope}-2026-week8-recap-`));
    if(rows.length!==6 || expected.length!==6 || expected.some(a=>a.hold) ||
      new Set(rows.map(r=>r.matchupKey)).size!==6)return [];
    const valid=rows.every(r=>{
      const a=expected.find(a=>a.registryId===r.scriptRegistryId && a.matchupKey===r.matchupKey);
      if(!a || !Array.isArray(r.teamIds) || r.teamIds.length!==2)return false;
      const pair=r.teamIds.map(String).sort((a,b)=>Number(a)-Number(b));
      return r.season===2026 && r.week===8 && r.kind==='recap' &&
        r.matchupKey===`${scope}-2026-week8-recap-${pair.join('-')}` && r.sourceRevision===a.scriptRevision &&
        r.writer===a.writer && r.id===a.videoId && videoId.test(r.id) &&
        r.scriptSha256===a.scriptSha256 && r.renderScriptSha256===a.renderScriptSha256 &&
        r.sourcePackageSha256===a.sourcePackageSha256 &&
        hash.test(r.sourceSha256) && r.sourceSha256===a.sourceVideoSha256 && r.sourceVideoSha256===r.sourceSha256 &&
        r.voiceId===a.voiceId && r.avatarId===a.avatarId && r.sourceAudioSha256===a.sourceAudioSha256 &&
        r.publicationApproved===true && typeof r.approvalSource==='string' && r.approvalSource.length>0 &&
        r.technicalQaPassed===true && Number.isFinite(r.durationSeconds) && r.durationSeconds>0 &&
        r.durationSeconds===a.durationSeconds && !r.videoUrl &&
        r.qaStatus==='technical_pass_owner_playback_waiver' && r.playbackExceptionId===waiverId &&
        r.playbackWaiverSourceMessageId===authority.sourceMessageId &&
        r.fullPlaybackInspection===false && r.independentAuditoryListening===false && r.performanceApproval===false &&
        ['short','matchup','left','right'].every(k=>typeof r[k]==='string' && r[k].length>0);
    });
    if(!valid || new Set(rows.flatMap(r=>r.teamIds.map(String))).size!==12)return [];
  }
  return manifest.filter(r=>r.edition===edition);
}
