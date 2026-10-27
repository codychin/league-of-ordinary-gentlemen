import test,{beforeEach,afterEach} from 'node:test'
import assert from 'node:assert/strict'
import {sharedDesk} from '../supabase/functions/brief-editorial-worker/shared.ts'
import {cappedCall} from '../supabase/functions/brief-editorial-worker/budget.ts'

const NativeDate=globalThis.Date
beforeEach(()=>{globalThis.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:['2026-10-25T16:30:00Z']))} static now(){return NativeDate.parse('2026-10-25T16:30:00Z')}}})
afterEach(()=>{globalThis.Date=NativeDate})

test('capacity refusal leaves candidate unconsumed and performs no paid call',async()=>{
 const oldFetch=globalThis.fetch; let pair=0,writes=0
 globalThis.fetch=async url=>{
  if(url.includes('/scoreboard'))return {ok:true,json:async()=>({events:[{id:'game',date:'2026-10-25T17:00:00Z',status:{type:{state:'pre'}},competitions:[]}]})}
  if(url.includes('/news?'))return {ok:true,json:async()=>({articles:[]})}
  throw Error('Unexpected network or paid call')
 }
 const db={rpc:async(name,args)=>{if(name==='claim_brief_attempt')return {data:true};assert.equal(name,'reserve_brief_call');const payload=JSON.parse(args.p_purpose);assert.equal(payload.mode,'draft_review_pair');assert.equal(payload.event_key,'game:pregame');assert.notEqual(args.p_id,payload.review_id);pair++;return {data:false}},from:()=>({select(){return this},gte:async()=>({data:[]}),insert(){writes++;throw Error('Event consumed')}})}
 try{assert.deepEqual(await sharedDesk(db,new Date('2026-10-25T16:30:00Z')),{ok:true,capacity_deferred:true});assert.equal(pair,1);assert.equal(writes,0)}finally{globalThis.fetch=oldFetch}
})

test('pre-reserved review consumes no second reservation and records actual usage only after response',async()=>{
 const oldDeno=globalThis.Deno;globalThis.Deno={env:{get:()=> 'test-key-not-real'}}
 let rpc=0,updated
 const db={rpc:async()=>{rpc++;throw Error('Double reserve')},from:table=>table==='brief_desk_control'?{select(){return this},eq(){return this},maybeSingle:async()=>({data:{enabled:true}})}:({update(data){updated=data;return {eq(){return this},select(){return this},maybeSingle:async()=>({data:{id:'reserved'}}),then(resolve){resolve({})}}}})}
 const fakeFetch=async()=>({ok:true,json:async()=>({usage:{input_tokens:100,output_tokens:10},output:[{content:[{type:'output_text',text:'{"verdict":"approve"}'}]}]})})
 try{assert.deepEqual(await cappedCall(db,'review','Review safely',{},fakeFetch,'reserved-review-id'),{verdict:'approve'});assert.equal(rpc,0);assert.equal(updated.status,'completed');assert.equal(updated.input_tokens,100)}finally{globalThis.Deno=oldDeno}
})

test('already-started or invalid reservation cannot trigger another paid request',async()=>{
 const oldDeno=globalThis.Deno;globalThis.Deno={env:{get:()=> 'test-key-not-real'}}
 let calls=0;const filters=[]
 const db={from:table=>table==='brief_desk_control'?{select(){return this},eq(){return this},maybeSingle:async()=>({data:{enabled:true}})}:({update:()=>({eq(k,v){filters.push([k,v]);return this},select(){return this},maybeSingle:async()=>({data:null})})})}
 try{await assert.rejects(()=>cappedCall(db,'review','Review',{},async()=>{calls++;throw Error('Must not run')},'used-slot'),/slot unavailable/);assert.equal(calls,0);assert.deepEqual(filters,[['id','used-slot'],['purpose','review'],['status','reserved']])}finally{globalThis.Deno=oldDeno}
})

test('disable switch still stops an already-reserved review before a paid call',async()=>{
 const oldDeno=globalThis.Deno;globalThis.Deno={env:{get:()=> 'test-key-not-real'}};let calls=0
 const db={from:table=>{assert.equal(table,'brief_desk_control');return {select(){return this},eq(){return this},maybeSingle:async()=>({data:{enabled:false}})}}}
 try{await assert.rejects(()=>cappedCall(db,'review','Review',{},async()=>{calls++},'reserved-slot'),/Generation paused/);assert.equal(calls,0)}finally{globalThis.Deno=oldDeno}
})


test('midnight reached during slot claim blocks paid fetch despite earlier reservation',async()=>{
 const oldDeno=globalThis.Deno;globalThis.Deno={env:{get:()=> 'test-key-not-real'}};let calls=0
 const db={from:table=>table==='brief_desk_control'?{select(){return this},eq(){return this},maybeSingle:async()=>({data:{enabled:true}})}:{update(){return {eq(){return this},select(){return this},async maybeSingle(){globalThis.Date.now=()=>NativeDate.parse('2026-10-26T04:00:00Z');return {data:{id:'slot'}}},then(resolve){resolve({})}}}}}
 try{await assert.rejects(()=>cappedCall(db,'review','Review',{},async()=>{calls++},'reserved-slot'),/Generation window closed/);assert.equal(calls,0)}finally{globalThis.Deno=oldDeno}
})
