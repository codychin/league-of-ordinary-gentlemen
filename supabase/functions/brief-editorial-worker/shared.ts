import {morningCandidates} from './morning.ts'
import {nflEvidence} from './evidence.ts'
import {modelEvidence} from './compact.ts'
import {contractInstructions,editorialContract,DESKS,validReview,reviewInstructions} from './contract.ts'
import {deskAssignment} from './assignment.ts'
import {cappedCall} from './budget.ts'
export function eventCandidates(nfl:any){
 const lean=modelEvidence({nfl}).nfl
 return lean.details.flatMap((d:any)=>{
  const game=lean.scoreboard.find((g:any)=>g.id===d.event)
  const plays=d.scoringPlays||[],last=plays.at(-1)
  const final=game?.status?.type?.state==='post'
  if(!last&&!final)return []
  const event_key=String(d.event)+':'+(final?'final':String(last.id||plays.length))
  // A single game, only the most recent scoring sequence and compact team totals.
  return [{event_key,as_of:lean.as_of,game,source_url:d.source_url,scoringPlays:plays.slice(-3),boxscore:{teams:d.boxscore?.teams,players:(d.boxscore?.players||[]).map((t:any)=>({...t,statistics:(t.statistics||[]).filter((s:any)=>['passing','rushing','receiving'].includes(s.name)).map((s:any)=>({...s,athletes:s.athletes.slice(0,5)}))}))}}]
 }).reverse()
}
export function validDraft(p:any){return p&&Object.hasOwn(DESKS,p.writer)&&typeof p.subject==='string'&&p.subject.length>=12&&p.subject.length<=140&&typeof p.text==='string'&&p.text.length>=100&&p.text.length<=1400&&typeof p.tag==='string'&&p.tag.length<=40}
// Keep the intended window aligned with lib/live-desk-state.js; DB enablement still gates work.
export function isSundayDeskScheduledWindow(now=new Date()){
 // One-time owner-approved window: October 18, 09:30 through midnight Eastern.
 const time=now.getTime()
 return time>=Date.parse('2026-10-18T13:30:00Z')&&time<Date.parse('2026-10-19T04:00:00Z')
}
export async function sharedDesk(db:any,now=new Date()){
 if(!isSundayDeskScheduledWindow(now))return {ok:true,closed:true}
 const {data:claimed,error}=await db.rpc('claim_brief_attempt');if(error)throw error
 if(!claimed)return {ok:true,idle:true}
 const nfl=await nflEvidence(),candidates=[...eventCandidates(nfl),...morningCandidates(nfl,now)]
 const {data:seen,error:seenError}=await db.from('brief_desk_events').select('event_key').gte('created_at',new Date(Date.now()-86400000).toISOString())
 if(seenError)throw seenError
 const item=candidates.find((x:any)=>!seen?.some((s:any)=>s.event_key===x.event_key));if(!item)return {ok:true,no_new_event:true}
 const {error:claimError}=await db.from('brief_desk_events').insert({event_key:item.event_key});if(claimError){if(claimError.code==='23505')return {ok:true,duplicate:true};throw claimError}
 const {data:recent,error:recentError}=await db.from('brief_global_live_posts').select('writer,subject,text').order('published_at',{ascending:false}).limit(8);if(recentError)throw recentError
 const snapshot=editorialContract(),contract=contractInstructions(snapshot),assignment=deskAssignment(recent||[])
 const packet={evidence:item,recent:recent||[],assignment}
 const draft=await cappedCall(db,'draft',`Return JSON only. Write one 70-130 word Live Desk post, or {"publish":false} if this event offers no earned new story. Only supplied evidence. Pregame and reported-news candidates are valid before kickoff; never describe scheduled games as underway. Attribute reported news, and reject injury/roster/transaction claims without primary or independent corroboration. GLOBAL NFL coverage: no fantasy-league teams, owners, standings, scores or invented local context. Do not merely recap a score; seek a specific insight or earned comic/human observation. Honor assignment priority and cooling desks. Return {"publish":true,"writer":"gannon|crane|kells|march|pike|sorrell","tag":"...","subject":"...","text":"..."}.`+contract,packet)
 if(!draft?.publish||!validDraft(draft)||assignment.cooling_desks.includes(draft.writer)){await db.from('brief_desk_events').update({status:'declined'}).eq('event_key',item.event_key);return {ok:true,declined:true}}
 if(!isSundayDeskScheduledWindow())return {ok:true,closed:true}
 const review=await cappedCall(db,'review',`Return JSON only. Independently check every claim against evidence, distinguish inference, enforce GLOBAL-only scope, desk voice, novelty and an earned point. Reject weak, unsupported, repeated or generic posts. No revision loop. Use the complete review schema below, with verdict approve or reject only (no revision loop); approve only with zero issues.`+contract+reviewInstructions(snapshot),{...packet,draft})
 if(!validReview(review,snapshot)||review.verdict!=='approve'){await db.from('brief_desk_events').update({status:'rejected'}).eq('event_key',item.event_key);return {ok:true,rejected:true}}
 if(!isSundayDeskScheduledWindow())return {ok:true,closed:true}
 const {data:post,error:publishError}=await db.from('brief_global_live_posts').insert({event_key:item.event_key,writer:draft.writer,tag:draft.tag,subject:draft.subject,text:draft.text,source_url:item.source_url,source_name:item.source_name||'ESPN',review:{...review,contract_version:snapshot.version}}).select('id').single()
 if(publishError)throw publishError
 await db.from('brief_desk_events').update({status:'published'}).eq('event_key',item.event_key)
 return {ok:true,published:true,post_id:post.id,scope:'global'}
}


