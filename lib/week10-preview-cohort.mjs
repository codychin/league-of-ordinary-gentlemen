export function selectWeek10PreviewCohort(rows,edition,authority){
 const editions=['loog','doge','sunday-crew'];
 if(!editions.includes(edition)||!Array.isArray(rows)||rows.length!==18||authority?.assets?.length!==18||new Set(rows.map(r=>r.id)).size!==18)return [];
 for(const scope of editions){
  const cohort=rows.filter(r=>r.edition===scope);
  if(cohort.length!==6||new Set(cohort.flatMap(r=>r.teamIds?.map(String)||[])).size!==12)return [];
  for(const r of cohort){
   const a=authority.assets.find(a=>a.id===r.id);
   if(!a||r.week!==10||r.season!==2026||r.kind!=='preview'||r.publicationApproved!==true||!r.approvalSource||r.teamIds?.length!==2||!Number.isFinite(r.durationSeconds)||r.durationSeconds<=0)return [];
   if(r.matchupKey!==`${scope}-2026-week10-preview-${[...r.teamIds].sort((a,b)=>a-b).join('-')}`)return [];
   if(['matchupKey','scriptSha256','sourceSha256','voiceId','avatarId'].some(k=>r[k]!==a[k]))return [];
   if(r.fullPlaybackInspection!==false||r.independentAuditoryListening!==false||r.performanceApproval!==false||r.qaStatus!=='owner_approved_review_limitations_disclosed')return [];
  }
 }
 return rows.filter(r=>r.edition===edition);
}
export function selectWeek10Matchup(rows,edition,week,a,b){
 if(Number(week)!==10||String(a)===String(b))return [];
 const pair=[String(a),String(b)].sort().join('-');
 return rows.filter(r=>r.edition===edition&&r.teamIds.map(String).sort().join('-')===pair);
}
