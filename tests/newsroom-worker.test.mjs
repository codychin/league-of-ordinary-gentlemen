import test from 'node:test'
import assert from 'node:assert/strict'
import {advanceRun} from '../supabase/functions/brief-editorial-worker/workflow.ts'
import {editorialContract,contractInstructions,reviewedForPublication} from '../supabase/functions/brief-editorial-worker/contract.ts'
import * as actualModels from '../supabase/functions/brief-editorial-worker/model.ts'

const pitch={id:'one',writer:'kells',thesis:'A specific cultural contradiction'}
const post={writer:'kells',tag:'CULTURE',subject:'A specific cultural contradiction',text:'A concrete observation grounded in the supplied reporting, followed by a particular comic consequence rather than a stock fantasy football punchline.',thread:'CULTURE'}
function fixture(status='selected',draft) {
 const state={run:{id:1,status,packet:{editorial_contract:editorialContract()},pitches:{pitches:[pitch]},decision:{publish:true,pitch_id:'one'},draft},posts:[],memory:[]}
 const db={from(table){
  let op='read',value
  const q={select(){return q},in(){return q},order(){return q},limit(){return q},eq(){return q},
   update(v){op='update';value=v;return q},insert(v){op='insert';value=v;return q},upsert(v){op='upsert';value=v;return q},
   async maybeSingle(){return {data:['queued','pitched','selected','written'].includes(state.run.status)?state.run:null}},
   async single(){state.posts.push(value);return {data:{id:42}}},
   then(resolve,reject){try{
    if(op==='update') Object.assign(state.run,value)
    if(op==='upsert') state.memory.push(value)
    const data=table==='brief_live_desk_posts'?state.posts:table==='brief_editorial_memory'?state.memory:null
    return Promise.resolve({data}).then(resolve,reject)
   }catch(e){return Promise.reject(e).then(resolve,reject)}}
  };return q
 }}
 const calls=[]
 const models={
  async writePost(){calls.push('write');return {...post}},
  async reviewPost(){calls.push('review');return {verdict:'approve',reason:'Specific, supported, distinct',issues:[]}},
  async revisePost(){calls.push('revise');return {...post,text:post.text+' Revised with a stronger observation.'}},
 }
 return {state,db,models,calls}
}
test('pins instructions before any model call',async()=>{
 const f=fixture();delete f.state.run.packet.editorial_contract
 assert.equal((await advanceRun(f.db,f.models)).contract_pinned,true)
 assert.equal(f.state.run.packet.editorial_contract.version,editorialContract().version)
 assert.deepEqual(f.calls,[])
})
test('a draft cannot publish until an independent review and subsequent publication step',async()=>{
 const f=fixture()
 await advanceRun(f.db,f.models)
 assert.equal(f.state.posts.length,0)
 await advanceRun(f.db,f.models)
 assert.equal(f.state.posts.length,0)
 assert.deepEqual(f.calls,['write','review'])
 await advanceRun(f.db,f.models)
 assert.equal(f.state.posts.length,1)
 assert.equal(f.state.run.status,'published')
})
test('revision retains prior draft and critique and needs a fresh approval',async()=>{
 const f=fixture();await advanceRun(f.db,f.models)
 f.models.reviewPost=async()=>({verdict:'revise',reason:'Generic conclusion',issues:['Make the consequence specific']})
 await advanceRun(f.db,f.models);await advanceRun(f.db,f.models)
 assert.equal(f.state.posts.length,0)
 assert.equal(f.state.run.draft.editorial.revision,1)
 assert.equal(f.state.run.draft.editorial.history[0].text,post.text)
 assert.equal(f.state.run.draft.editorial.history[0].review.verdict,'revise')
 assert.equal(reviewedForPublication(f.state.run.draft,editorialContract()),false)
})
test('revision limit rejects instead of spending indefinitely',async()=>{
 const f=fixture();await advanceRun(f.db,f.models)
 f.models.reviewPost=async()=>({verdict:'revise',reason:'Still generic',issues:['Replace stock joke']})
 for(let i=0;i<6;i++) await advanceRun(f.db,f.models)
 assert.equal(f.state.run.status,'rejected')
 assert.equal(f.calls.filter(x=>x==='revise').length,2)
 assert.equal(f.state.posts.length,0)
})
test('legacy written drafts must be reviewed',async()=>{
 const f=fixture('written',{...post})
 await advanceRun(f.db,f.models)
 assert.deepEqual(f.calls,['review'])
 assert.equal(f.state.posts.length,0)
})
test('malformed or contradictory approvals fail closed',async()=>{
 const f=fixture();await advanceRun(f.db,f.models)
 f.models.reviewPost=async()=>({verdict:'approve',reason:'Fine',issues:['Invented quotation']})
 await assert.rejects(advanceRun(f.db,f.models),/Invalid editorial review/)
 assert.equal(f.state.posts.length,0)
})
test('writer changes are rejected',async()=>{
 const f=fixture();f.models.writePost=async()=>({...post,writer:'march'})
 await assert.rejects(advanceRun(f.db,f.models),/assigned writer changed/)
 assert.equal(f.state.posts.length,0)
})
test('approval for a different contract cannot publish',async()=>{
 const f=fixture();await advanceRun(f.db,f.models);await advanceRun(f.db,f.models)
 f.state.run.draft.editorial.review.contract_version='obsolete'
 await assert.rejects(advanceRun(f.db,f.models),/matching approval/)
 assert.equal(f.state.posts.length,0)
})
test('every model stage actually receives the pinned corrections',async()=>{
 const oldFetch=globalThis.fetch,oldDeno=globalThis.Deno,requests=[]
 globalThis.Deno={env:{get:()=> 'test-key'}}
 globalThis.fetch=async(url,options)=>{
  requests.push(JSON.parse(options.body))
  return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'{}'}]}]})}
 }
 try{
  const packet={editorial_contract:editorialContract()}
  await actualModels.researchConnections(packet)
  await actualModels.editorialMeeting(packet,[])
  await actualModels.selectPitch(packet,[pitch])
  await actualModels.writePost(packet,pitch)
  await actualModels.reviewPost(packet,pitch,post,[])
  await actualModels.revisePost(packet,pitch,post,{})
  assert.equal(requests.length,6)
  for(const request of requests) {
   assert.match(request.instructions,/MANDATORY EDITORIAL CONTRACT 2026-10-02.1/)
   assert.match(request.instructions,/first-person/)
   assert.match(request.instructions,/reluctant acceptance of flawed audio/)
  }
 }finally{globalThis.fetch=oldFetch;globalThis.Deno=oldDeno}
})
test('all six desk profiles and no-quota policy are retained',()=>{
 const c=editorialContract()
 assert.equal(Object.keys(c.desks).length,6)
 assert.match(contractInstructions(c),/at most three/)
 assert.match(c.desks.crane,/Let the material determine structure/)
})

test('a malformed selected pitch is retired rather than blocking every later job',async()=>{
 const f=fixture();f.state.run.decision.pitch_id='missing'
 const result=await advanceRun(f.db,f.models)
 assert.equal(result.status,'rejected');assert.equal(f.state.run.error,'Selected pitch missing')
 assert.deepEqual(f.calls,[])
})
test('expired jobs and exhausted retries are retired without model spending',async()=>{
 for(const patch of [{created_at:'2026-09-01T00:00:00Z'},{attempts:16}]){
  const f=fixture();Object.assign(f.state.run,patch)
  assert.equal((await advanceRun(f.db,f.models)).status,'rejected')
  assert.deepEqual(f.calls,[])
 }
})

test('batch publishes through independent review without cron gaps',async()=>{
 const {advanceBatch}=await import('../supabase/functions/brief-editorial-worker/cadence.ts')
 const f=fixture();const result=await advanceBatch(f.db,f.models)
 assert.equal(result.status,'published');assert.deepEqual(f.calls,['write','review']);assert.equal(f.state.posts.length,1)
})
test('batch still rejects a draft that cannot pass revision',async()=>{
 const {advanceBatch}=await import('../supabase/functions/brief-editorial-worker/cadence.ts')
 const f=fixture();f.models.reviewPost=async()=>({verdict:'revise',reason:'Unsupported conclusion',issues:['Remove the claim']})
 const result=await advanceBatch(f.db,f.models)
 assert.equal(result.status,'rejected');assert.equal(f.state.posts.length,0)
})
test('assignment cools consecutive bylines without pretending other voices are interchangeable',async()=>{
 const {deskAssignment}=await import('../supabase/functions/brief-editorial-worker/assignment.ts')
 const assignment=deskAssignment([{writer:'gannon'},{writer:'gannon'},{writer:'pike'}])
 assert.deepEqual(assignment.cooling_desks,['gannon']);assert.equal(assignment.priority_desks.includes('gannon'),false)
 assert.equal(assignment.priority_desks[0],'crane')
})
test('model packet preserves box score labels, facts and sources and deduplicates syndicated news',async()=>{
 const {modelEvidence}=await import('../supabase/functions/brief-editorial-worker/compact.ts')
 const article={id:1,headline:'Verified headline',description:'Verified detail',published:'2026-10-04'}
 const game={event:'1',source_url:'https://example.com/1',news:{articles:[article]},boxscore:{players:[{team:{displayName:'Team A',logo:'discard'},statistics:[{name:'passing',labels:['YDS'],descriptions:['Yards'],athletes:[{athlete:{id:'2',displayName:'Player A',headshot:'discard'},stats:['123']}]}]}]}}
 const input={packet:{nfl:{as_of:'2026-10-04',scoreboard:[],details:[game,{...game,event:'2'}]}}}
 const out=modelEvidence(input)
 assert.equal(out.packet.nfl.reporting.length,1)
 assert.equal(out.packet.nfl.details[0].source_url,game.source_url)
 assert.deepEqual(out.packet.nfl.details[0].boxscore.players[0].statistics[0].athletes[0],{athlete:{id:'2',displayName:'Player A'},stats:['123']})
 assert.equal(JSON.stringify(out).includes('discard'),false)
 assert.equal(game.boxscore.players[0].team.logo,'discard')
})
