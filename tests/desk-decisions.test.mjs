import test from 'node:test'
import assert from 'node:assert/strict'
import {decisionMetadata,selectCandidate,recordDecision} from '../supabase/functions/brief-editorial-worker/decisions.ts'
const now=new Date('2026-10-18T16:30:00Z')
const pre=(id,date='2026-10-18T17:00:00Z')=>({kind:'pregame',event_key:id+':pregame',game:{date}})
test('pregame kickoff boundary and 30-minute attempt throttle',()=>{
 assert.equal(selectCandidate([pre('later','2026-10-18T17:31:00Z')],[],now),undefined)
 assert.equal(selectCandidate([pre('past','2026-10-18T16:30:00Z')],[],now),undefined)
 assert.equal(selectCandidate([pre('edge','2026-10-18T17:30:00Z')],[],now).event_key,'edge:pregame')
 assert.equal(selectCandidate([pre('new')],[{event_key:'old:pregame',created_at:'2026-10-18T16:00:01Z'}],now),undefined)
 assert.equal(selectCandidate([pre('new')],[{event_key:'old:pregame',created_at:'2026-10-18T16:00:00Z'}],now).event_key,'new:pregame')
})
test('live action bypasses pregame throttle and gets priority; consumed keys never retry',()=>{
 const live={event_key:'game:play1'},news={kind:'reported-news',event_key:'news:1'}
 const seen=[{event_key:'old:pregame',created_at:now.toISOString()}]
 assert.equal(selectCandidate([pre('new'),news,live],seen,now),live)
 assert.equal(selectCandidate([live,news],[...seen,{event_key:live.event_key}],now),news)
 assert.equal(selectCandidate([live],[{event_key:live.event_key,status:'rejected'}],now),undefined)
})
test('deferral neither consumes candidate nor mutates seen records',()=>{
 const item=pre('new'),seen=[{event_key:'old:pregame',created_at:'2026-10-18T16:10:00Z'}]
 const before=JSON.stringify(seen)
 assert.equal(selectCandidate([item],seen,now),undefined)
 assert.equal(JSON.stringify(seen),before)
 assert.equal(selectCandidate([item],seen,new Date('2026-10-18T16:40:00Z')),item)
})
test('audit metadata is bounded and allowlisted, not full model artifacts',()=>{
 const review={verdict:'reject',reason:'x'.repeat(900),issues:Array(20).fill('y'.repeat(500)),checks:{a:{status:'unverified',evidence:'z'.repeat(500)}},draft:'PRIVATE',prompt:'PRIVATE'}
 const result=decisionMetadata('review',review,{version:'test',review_checks:['a']},true)
 assert.equal(result.reason.length,600);assert.equal(result.issues.length,5);assert.equal(result.issues[0].length,200)
 assert.equal(result.checks.a.evidence.length,240);assert.equal(result.schema_valid,true)
 assert.ok(!JSON.stringify(result).includes('PRIVATE'))
 assert.equal(decisionMetadata('review',null,{review_checks:['a']},false).verdict,'invalid')
})
test('audit write failure is explicit and cannot silently pass',async()=>{
 await assert.rejects(()=>recordDecision({from:()=>({update:()=>({eq:async()=>({error:{message:'failure'}})})})},'key','rejected',{}),/Decision audit write failed/)
})

test('reachable deferred pregame causes zero paid reservations and event writes',async()=>{
 const {sharedDesk}=await import('../supabase/functions/brief-editorial-worker/shared.ts')
 const oldFetch=globalThis.fetch
 let reservations=0,writes=0
 globalThis.fetch=async url=>{
  if(url.includes('/scoreboard'))return {ok:true,json:async()=>({events:[{id:'later',date:'2026-10-18T17:00:00Z',status:{type:{state:'pre'}},competitions:[]}]})}
  if(url.includes('/news?'))return {ok:true,json:async()=>({articles:[]})}
  throw new Error('Unexpected network or paid call')
 }
 const db={rpc:async name=>{if(name!=='claim_brief_attempt')reservations++;return {data:true}},from:()=>({select(){return this},gte:async()=>({data:[]}),insert(){writes++;throw new Error('Deferred event consumed')}})}
 try{assert.deepEqual(await sharedDesk(db,new Date('2026-10-18T14:30:00Z')),{ok:true,no_new_event:true});assert.equal(reservations,0);assert.equal(writes,0)}
 finally{globalThis.fetch=oldFetch}
})
