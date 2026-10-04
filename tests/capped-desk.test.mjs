import test from 'node:test'
import assert from 'node:assert/strict'
import {requestBody,cappedCall,MAX_BYTES,MAX_OUTPUT} from '../supabase/functions/brief-editorial-worker/budget.ts'
import {eventCandidates,validDraft} from '../supabase/functions/brief-editorial-worker/shared.ts'
import fs from 'node:fs'
test('worst-case byte-token bound plus output stays below the nonrefundable reservation',()=>{
 assert.ok(((MAX_BYTES+2048)*.75+MAX_OUTPUT*4.5)/1e6<.10)
 assert.throws(()=>requestBody('JSON','x'.repeat(MAX_BYTES)),/exceeds/)
 assert.throws(()=>requestBody('JSON','😀'.repeat(MAX_BYTES/3)),/exceeds/)
 const r=requestBody('JSON',{});assert.equal(r.model,'gpt-5.4-mini');assert.equal(r.service_tier,'default');assert.equal(r.max_output_tokens,3000);assert.equal(r.tools,undefined)
})
test('budget denial or database error makes zero model calls',async()=>{
 const old=globalThis.Deno;globalThis.Deno={env:{get:()=> 'test'}};let calls=0
 try{for(const result of [{data:false},{error:new Error('db down')}])await assert.rejects(cappedCall({rpc:async()=>result},'draft','JSON',{},async()=>{calls++}),/budget exhausted/);assert.equal(calls,0)}finally{globalThis.Deno=old}
})
test('failed provider calls retain reservation and never automatically retry',async()=>{
 const old=globalThis.Deno;globalThis.Deno={env:{get:()=> 'test'}};let reserved=0,calls=0
 const db={rpc:async()=>{reserved++;return {data:true}},from:()=>({update:()=>({eq:async()=>({})})})}
 try{await assert.rejects(cappedCall(db,'draft','JSON',{},async()=>{calls++;return {ok:false,status:429,json:async()=>({})}}),/429/);assert.equal(reserved,1);assert.equal(calls,1)}finally{globalThis.Deno=old}
})
test('ordinary clock changes cannot create new paid events',()=>{
 const nfl={as_of:'now',scoreboard:[{id:'1',status:{type:{state:'in'}}}],details:[{event:'1',source_url:'https://example.com',scoringPlays:[{id:'td1',text:'touchdown'}],boxscore:{}}]}
 const first=eventCandidates(nfl)[0];nfl.scoreboard[0].status.displayClock='1:23';assert.equal(eventCandidates(nfl)[0].event_key,first.event_key)
 nfl.details[0].scoringPlays.push({id:'td2'});assert.notEqual(eventCandidates(nfl)[0].event_key,first.event_key)
 assert.equal(eventCandidates({...nfl,details:[{event:'1',boxscore:{}}]}).length,0)
})
test('invalid drafts cannot reach publication',()=>{assert.equal(Boolean(validDraft({writer:'invented'})),false)})
test('only capped workflow is reachable from worker entrypoint',()=>{
 const src=fs.readFileSync('supabase/functions/brief-editorial-worker/index.ts','utf8');assert.match(src,/sharedDesk/);assert.doesNotMatch(src,/advanceRun|advanceBatch|advanceEdition/)
 const engine=fs.readFileSync('supabase/functions/brief-sunday-engine/index.ts','utf8').split('Deno.serve')[1];assert.doesNotMatch(engine,/generateAndPublish|publishCandidate/)
})
