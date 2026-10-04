import {nflEvidence} from './evidence.ts'
import {advanceBatch} from './cadence.ts'
import {editorialContract} from './contract.ts'

const tables:Record<string,string>={brief_live_desk_posts:'brief_edition_live_posts',brief_editorial_runs:'brief_edition_editorial_runs',brief_editorial_memory:'brief_edition_editorial_memory'}
// The existing editorial workflow never receives an unscoped database handle.
export function editionDatabase(db:any,slug:string){
 return {from(table:string){
  const name=tables[table];if(!name)throw new Error('Unsupported edition table: '+table)
  const scoped=(row:any)=>({...row,edition_slug:slug})
  return {
   select(...args:any[]){return db.from(name).select(...args).eq('edition_slug',slug)},
   update(row:any){const {edition_slug,...values}=row;return db.from(name).update(values).eq('edition_slug',slug)},
   insert(row:any){return db.from(name).insert(Array.isArray(row)?row.map(scoped):scoped(row))},
   upsert(row:any,options:any={}){return db.from(name).upsert(scoped(row),{...options,onConflict:'edition_slug,'+options.onConflict})},
  }
 }}
}
export function deskOpen(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now)
 const get=(type:string)=>parts.find(p=>p.type===type)?.value
 return get('weekday')==='Sun'&&(Number(get('hour'))*60+Number(get('minute'))>=765)
}
export function editionContext(edition:any,now=Date.now()){
 const snapshots=edition?.snapshots||{}
 const local:any={edition:edition?.tenant?.name||'Sunday Crew',as_of:new Date(now).toISOString(),historical:{}}
 for(const type of ['rosters','standings','matchups','transactions']){
  const snapshot=snapshots[type];if(!snapshot)continue
  const age=now-new Date(snapshot.created_at).getTime()
  // Stale scores/lineups must never enter the current league evidence.
  if(age>=0&&age<=13*60*1000)local[type]={as_of:snapshot.created_at,data:snapshot.data}
  else if(type==='standings')local.historical.standings={as_of:snapshot.created_at,data:snapshot.data}
 }
 local.rules='This edition is Sunday Crew only. Historical standings are dated background, not live results. Missing current rosters, scores and transactions are UNKNOWN. Never claim current ownership, starters, scores or matchups without current evidence. Do not borrow LOOG identities or jokes.'
 return local
}
export async function advanceEdition(db:any,models:any,slug='sunday-crew'){
 if(!deskOpen())return {ok:true,edition:slug,closed:true}
 const owner=crypto.randomUUID()
 const {data:claimed,error:claimError}=await db.rpc('claim_edition_desk',{p_slug:slug,p_owner:owner})
 if(claimError)throw claimError
 if(!claimed)return {ok:true,edition:slug,busy:true}
 const d=editionDatabase(db,slug)
 try{
  const {data:open,error}=await d.from('brief_editorial_runs').select('*').in('status',['queued','pitched','selected','written']).order('created_at',{ascending:true}).limit(1).maybeSingle()
  if(error)throw error
  if(open){
   // Bounded retries and fresh evidence; abandoned work cannot block the bureau.
   if(open.attempts>=16||Date.now()-new Date(open.created_at).getTime()>23*60*1000){
    const {error}=await d.from('brief_editorial_runs').update({status:'rejected',error:'Run expired or retry limit reached',updated_at:new Date().toISOString()}).eq('id',open.id)
    if(error)throw error
    return {ok:true,edition:slug,expired:true}
   }
   // Recover a publication whose subsequent memory/save step failed.
   const {data:published,error:postError}=await d.from('brief_live_desk_posts').select('id').eq('story_key','model-run:'+open.id).maybeSingle()
   if(postError)throw postError
   if(published){await d.from('brief_editorial_runs').update({status:'published'}).eq('id',open.id);return {ok:true,recovered:true}}
   return {edition:slug,...await advanceBatch(d,models)}
  }
  const {data:last,error:lastError}=await d.from('brief_editorial_runs').select('created_at').order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(lastError)throw lastError
  if(last&&Date.now()-new Date(last.created_at).getTime()<3*60*1000)return {ok:true,idle:true,edition:slug}
  const {data:edition,error:editionError}=await db.rpc('get_public_brief_edition',{p_slug:slug})
  if(editionError||!edition?.league)throw editionError||new Error('Edition unavailable')
  const [nfl,recent,memory]=await Promise.all([
   nflEvidence(),
   d.from('brief_live_desk_posts').select('subject,text,writer,tag,published_at').eq('status','live').order('sort_time',{ascending:false}).limit(50),
   d.from('brief_editorial_memory').select('writer,premise_key,thesis,created_at').order('created_at',{ascending:false}).limit(50),
  ])
  if(recent.error||memory.error)throw recent.error||memory.error
  const packet={edition_slug:slug,editorial_contract:editorialContract(),league:editionContext(edition),nfl,recent:recent.data||[],memory:memory.data||[],lore:[],mission:'Cover this Sunday with distinct, evidence-backed reporting. General NFL coverage is welcome. Do not force local consequences or invent unavailable league data. Silence is better than filler.'}
  const {error:insertError}=await d.from('brief_editorial_runs').insert({packet})
  if(insertError)throw insertError
  return {edition:slug,...await advanceBatch(d,models)}
 }finally{
  await db.from('brief_edition_desk_leases').update({until_at:new Date().toISOString()}).eq('edition_slug',slug).eq('owner',owner)
 }
}
