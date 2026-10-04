import {deskAssignment} from './assignment.ts'
import {nflEvidence} from './evidence.ts'
import {editorialContract,draftProblems,validReview,reviewedForPublication,MAX_REVISIONS} from './contract.ts'
import {publishable} from './quality.ts'
import {redundant} from './editorial.ts'
import {recentMemory,remember} from './memory.ts'

export async function advanceRun(d:any,models:any) {
 const {data:run,error:readError}=await d.from('brief_editorial_runs').select('*').in('status',['queued','pitched','selected','written']).order('created_at',{ascending:true}).limit(1).maybeSingle()
 if(readError) throw readError
 if(!run) return {ok:true,idle:true}
 const save=async (values:any)=>{
  const {error}=await d.from('brief_editorial_runs').update({...values,updated_at:new Date().toISOString()}).eq('id',run.id)
  if(error) throw error
 }
 if((run.attempts||0)>=16||(run.created_at&&Date.now()-new Date(run.created_at).getTime()>25*60*1000)){
  await save({status:'rejected',error:'Expired evidence or retry limit reached'});return {ok:true,id:run.id,status:'rejected'}
 }
 // Pin once before any model call. Existing jobs retain their exact instructions.
 if(!run.packet?.editorial_contract) {
  await save({packet:{...run.packet,editorial_contract:editorialContract()}})
  return {ok:true,id:run.id,status:run.status,contract_pinned:true}
 }
 let packet=run.packet;const contract=packet.editorial_contract
 await save({attempts:(run.attempts||0)+1})
 if(run.status==='queued') {
  if(!packet.nfl?.details?.length){packet={...packet,reporting:Array.isArray(packet.nfl)?packet.nfl:packet.reporting,nfl:await nflEvidence()}}
  const {data:bylines,error:bylineError}=await d.from('brief_live_desk_posts').select('writer,subject,published_at').eq('status','live').order('sort_time',{ascending:false}).limit(6)
  if(bylineError)throw bylineError
  packet={...packet,assignment:deskAssignment(bylines||[])};await save({packet})
  const research=await models.researchConnections(packet)
  const x=await models.editorialMeeting(packet,research?.connections||[])
  if(!Array.isArray(x?.pitches)||x.pitches.length>3) throw new Error('Invalid pitch count')
  await save({status:'pitched',pitches:{...x,research},error:null})
  return {ok:true,id:run.id,status:'pitched'}
 }
 if(run.status==='pitched') {
  const eligible=(run.pitches?.pitches||[]).filter((p:any)=>!packet.assignment?.cooling_desks?.includes(p.writer))
  const x=await models.selectPitch(packet,eligible)
  if(typeof x?.publish!=='boolean') throw new Error('Invalid editorial decision')
  if(x.publish && !eligible.some((p:any)=>p.id===x.pitch_id)) throw new Error('Selected pitch missing')
  await save({status:x.publish?'selected':'complete',decision:x,error:null})
  return {ok:true,id:run.id,status:x.publish?'selected':'complete'}
 }
 const pitch=(run.pitches?.pitches||[]).find((p:any)=>p.id===run.decision?.pitch_id)
 if(!pitch){await save({status:'rejected',error:'Selected pitch missing'});return {ok:true,id:run.id,status:'rejected'}}
 if(run.status==='selected') {
  const x=await models.writePost(packet,pitch),problems=draftProblems(x,pitch)
  if(problems.length) throw new Error(problems.join('; '))
  await save({status:'written',draft:{...x,evidence:{pitch,editor_reason:run.decision?.reason},editorial:{contract_version:contract.version,revision:0,history:[]}},error:null})
  return {ok:true,id:run.id,status:'written'}
 }
 const post=run.draft,problems=draftProblems(post,pitch)
 if(problems.length) {
  await save({status:'rejected',error:problems.join('; ')})
  return {ok:true,id:run.id,status:'rejected'}
 }
 const editorial=post.editorial||{contract_version:contract.version,revision:0,history:[]}
 if(editorial.contract_version!==contract.version) throw new Error('Draft contract mismatch')
 const {data:recent,error:recentError}=await d.from('brief_live_desk_posts').select('subject,text,writer,tag,published_at,story_key').eq('status','live').order('sort_time',{ascending:false}).limit(100)
 if(recentError) throw recentError
 const memory=await recentMemory(d)
 if(!editorial.review) {
  const review=await models.reviewPost(packet,pitch,post,recent||[])
  if(!validReview(review)) throw new Error('Invalid editorial review')
  await save({draft:{...post,editorial:{...editorial,review:{...review,contract_version:contract.version,revision:editorial.revision}}},error:null})
  return {ok:true,id:run.id,status:'written',review:review.verdict}
 }
 const review=editorial.review
 if(!validReview(review)) throw new Error('Invalid stored editorial review')
 if(review.verdict==='reject'||(review.verdict==='revise'&&editorial.revision>=MAX_REVISIONS)) {
  await save({status:'rejected',error:review.verdict==='reject'?review.reason:'Revision limit: '+review.reason})
  return {ok:true,id:run.id,status:'rejected'}
 }
 if(review.verdict==='revise') {
  const x=await models.revisePost(packet,pitch,post,review),issues=draftProblems(x,pitch)
  if(issues.length) throw new Error(issues.join('; '))
  await save({draft:{...x,evidence:post.evidence,editorial:{contract_version:contract.version,revision:editorial.revision+1,history:[...(editorial.history||[]),{subject:post.subject,text:post.text,review}]}},error:null})
  return {ok:true,id:run.id,status:'written',revised:true}
 }
 if(!reviewedForPublication(post,contract)) throw new Error('Draft has no matching approval')
 if(!publishable(post)||redundant(post,[...(recent||[]),...memory])) {
  await save({status:'rejected',error:'Final quality or memory gate'})
  return {ok:true,id:run.id,status:'rejected'}
 }
 const story_key='model-run:'+run.id
 const {data:created,error}=await d.from('brief_live_desk_posts').insert({writer:post.writer,tag:post.tag,subject:post.subject,text:post.text,thread:post.thread||'LIVE DESK',story_key,status:'live',published_at:new Date().toISOString(),sort_time:new Date().toISOString()}).select('id').single()
 if(error) throw error
 await remember(d,{...post,story_key},created?.id)
 await save({status:'published',error:null})
 return {ok:true,id:run.id,status:'published',post_id:created?.id}
}

