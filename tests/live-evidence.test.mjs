import test from 'node:test'
import assert from 'node:assert/strict'
import {nflEvidence} from '../supabase/functions/brief-editorial-worker/evidence.ts'
test('current games include box scores and every fetch uses compatible headers',async()=>{
 const original=globalThis.fetch;const calls=[]
 globalThis.fetch=async(url,options)=>{calls.push(options);return {ok:true,json:async()=>String(url).includes('scoreboard')?{events:[{id:'today',date:new Date().toISOString(),status:{type:{state:'in'}}},{id:'old',date:'2020-01-01T00:00:00Z',status:{type:{state:'post'}}}]}:{boxscore:{players:[{team:'verified'}]}}}}
 try{const result=await nflEvidence();assert.equal(result.scoreboard.length,1);assert.equal(result.details.length,1);assert.equal(result.details[0].event,'today');assert.ok(calls.every(x=>x.headers['User-Agent']==='Mozilla/5.0'))}finally{globalThis.fetch=original}
})
test('all summary requests failing cannot silently become an empty evidence packet',async()=>{
 const original=globalThis.fetch
 globalThis.fetch=async url=>String(url).includes('scoreboard')?{ok:true,json:async()=>({events:[{id:'today',date:new Date().toISOString(),status:{type:{state:'in'}}}]})}:{ok:false,status:403}
 try{await assert.rejects(nflEvidence(),/All live game summaries failed/)}finally{globalThis.fetch=original}
})
