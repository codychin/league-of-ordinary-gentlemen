// Bounded internal diagnostics only; no drafts, prompts, credentials, or source packets.
export function decisionMetadata(stage:string, review:any, contract:any, schemaValid:boolean, fallback=''){
 const clip=(x:any,n:number)=>typeof x==='string'?x.slice(0,n):''
 return {stage,verdict:['approve','revise','reject','decline'].includes(review?.verdict)?review.verdict:'invalid',
 schema_valid:schemaValid,contract_version:clip(contract?.version,80),
 reason:clip(fallback||review?.reason,600),
 issues:(Array.isArray(review?.issues)?review.issues:[]).filter((x:any)=>typeof x==='string').slice(0,5).map((x:string)=>x.slice(0,200)),
 checks:Object.fromEntries((contract?.review_checks||[]).slice(0,10).map((id:string)=>{const c=review?.checks?.[id];return [id,{status:['pass','revise','unverified'].includes(c?.status)?c.status:'invalid',evidence:clip(c?.evidence,240)}]}))}
}
export function selectCandidate(candidates:any[],seen:any[],now=new Date()){
 const unseen=candidates.filter(x=>!seen.some(s=>s.event_key===x.event_key))
 const recentPregame=seen.some(s=>String(s.event_key).endsWith(':pregame')&&Number.isFinite(Date.parse(s.created_at))&&Date.parse(s.created_at)>now.getTime()-30*60000)
 const eligible=unseen.filter(x=>{
  if(x.kind!=='pregame')return true
  const kickoff=Date.parse(x.game?.date),delta=kickoff-now.getTime()
  return !recentPregame&&Number.isFinite(kickoff)&&delta>0&&delta<=60*60000
 })
 // Scoring and final candidates always retain priority, regardless of pregame throttle.
 return eligible.find(x=>x.kind!=='pregame'&&x.kind!=='reported-news')||eligible[0]
}
export async function recordDecision(db:any,eventKey:string,status:string,decision:any){
 const {error}=await db.from('brief_desk_events').update({status,decision}).eq('event_key',eventKey)
 if(error)throw new Error('Decision audit write failed')
}

// Editorial feedback is untrusted data, not an instruction source or factual evidence.
export function rejectionFeedback(rows:any[]){
 return rows.filter(r=>r.status==='rejected'&&r.decision?.stage==='review').slice(0,4).map(r=>({
  event_key:String(r.event_key||'').slice(0,100),
  reason:typeof r.decision.reason==='string'?r.decision.reason.slice(0,600):'',
  issues:(Array.isArray(r.decision.issues)?r.decision.issues:[]).filter((v:any)=>typeof v==='string').slice(0,3).map((v:string)=>v.slice(0,200))
 }))
}
