import test from 'node:test'
import assert from 'node:assert/strict'
import {editorialContract,contractInstructions,validReview,reviewedForPublication} from '../supabase/functions/brief-editorial-worker/contract.ts'
import {sharedDesk} from '../supabase/functions/brief-editorial-worker/shared.ts'

const contract=editorialContract()
const checks=()=>Object.fromEntries(contract.review_checks.map(id=>[id,{status:'pass',evidence:'Specific fixture-only assessment, not a real editorial evaluation'}]))
const approval=()=>({verdict:'approve',reason:'Fixture approval',issues:[],checks:checks()})

test('all cultural and character corrections survive instruction serialization',()=>{
 const text=contractInstructions(contract)
 for(const rule of ['cultural-purpose','reader-respect','earned-delight','independent-angle','reporting-honesty','creative-ownership','continuing-edit']) assert.ok(text.includes(rule+':'))
 for(const phrase of ['Show, not tell is canonical','laugh-crying','not a compulsory sentimental ending','strongest moral compass','dealmaker','regression to the mean','remains unresolved','tentative character aspiration','leads trends','age and lived experience','direct creative relationship']) assert.ok(text.includes(phrase),phrase)
 assert.equal(contract.version,'2026-10-17.1')
})
test('approval requires specific coverage of every culture review dimension',()=>{
 assert.equal(validReview(approval(),contract),true)
 for(const id of contract.review_checks){
  for(const value of [undefined,{status:'pass',evidence:''},{status:'unverified',evidence:'Closest coverage not provided'},{status:'revise',evidence:'Explains the punchline'}]){
   const review=approval();review.checks[id]=value
   assert.equal(validReview(review,contract),false,id)
  }
 }
 const legacy={...contract};delete legacy.review_checks
 assert.equal(validReview({verdict:'approve',reason:'Old job',issues:[]},legacy),true)
 const review=approval();review.checks['reader-respect']={status:'revise',evidence:'Explains the moral'};review.verdict='revise';review.issues=['Trust the reader']
 assert.equal(validReview(review,contract),true)
})
test('stored approval lacking culture review cannot satisfy the new publication gate',()=>{
 const review={verdict:'approve',reason:'Looks fine',issues:[],contract_version:contract.version,revision:0}
 assert.equal(reviewedForPublication({editorial:{contract_version:contract.version,revision:0,review}},contract),false)
})

async function runShared(review){
 const oldDate=globalThis.Date,oldFetch=globalThis.fetch,oldDeno=globalThis.Deno
 const now='2026-10-18T18:00:00Z',requests=[],posts=[]
 globalThis.Date=class extends oldDate {constructor(...args){super(...(args.length?args:[now]))} static now(){return oldDate.parse(now)}}
 globalThis.Deno={env:{get:()=> 'fixture-only-key'}}
 const draft={publish:true,writer:'kells',tag:'CULTURE',subject:'A specific cultural contradiction',text:'A concrete observation grounded in the supplied reporting, followed by a particular comic consequence rather than a stock fantasy football punchline.'}
 globalThis.fetch=async(url,options)=>{
  if(url.includes('api.openai.com')){requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify(requests.length===1?draft:review)}]}]})}}
  if(url.includes('/scoreboard'))return {ok:true,json:async()=>({events:[{id:'game1',date:now,status:{type:{state:'post'}},competitions:[]}]})}
  if(url.includes('/summary'))return {ok:true,json:async()=>({scoringPlays:[{id:'play1',text:'A verified fixture play'}],boxscore:{}})}
  if(url.includes('/news?'))return {ok:true,json:async()=>({articles:[]})}
  throw new Error('Unexpected network request '+url)
 }
 const db={rpc:async()=>({data:true}),from(table){let inserted
  const q={select(){return q},gte(){return q},order(){return q},limit(){return q},eq(){return q},update(){return q},insert(value){inserted=value;return q},async single(){if(table==='brief_global_live_posts')posts.push(inserted);return {data:{id:1}}},then(resolve,reject){return Promise.resolve({data:[]}).then(resolve,reject)}}
  return q
 }}
 try{return {result:await sharedDesk(db),requests,posts}}
 finally{globalThis.Date=oldDate;globalThis.fetch=oldFetch;globalThis.Deno=oldDeno}
}
test('reachable capped draft and review receive culture; approved review retains version',async()=>{
 const {result,requests,posts}=await runShared(approval())
 assert.equal(result.published,true);assert.equal(requests.length,2)
 for(const request of requests){assert.match(request.instructions,/MANDATORY EDITORIAL CONTRACT 2026-10-17.1/);assert.match(request.instructions,/Show, not tell is canonical/);assert.match(request.instructions,/strongest moral compass/);assert.match(request.instructions,/Do not regurgitate other journalists/)}
 assert.match(requests[1].instructions,/Return the complete review JSON schema/ )
 assert.match(requests[1].instructions,/"checks":\{"reader-respect"/)
 assert.match(requests[1].instructions,/Return checks as an object/)
 assert.match(requests[1].instructions,/missing necessary comparison is unverified/)
 assert.equal(posts[0].review.contract_version,contract.version)
})
test('reachable shared path rejects missing or unverified culture review, without retry',async()=>{
 for(const review of [{verdict:'approve',reason:'Fine',issues:[]},(()=>{const r=approval();r.checks['independent-angle']={status:'unverified',evidence:'No closest treatment available'};return r})()]){
  const {result,requests,posts}=await runShared(review)
  assert.equal(result.rejected,true);assert.equal(requests.length,2);assert.equal(posts.length,0)
 }
})
