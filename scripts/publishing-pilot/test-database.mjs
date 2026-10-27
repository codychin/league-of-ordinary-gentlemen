import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {sql,call,ACTORS,quote,RENDERER} from './local-db.mjs';
import {validateCandidate,correction,rotation,localFixture,JAY} from '../../lib/publishing-pilot/model.mjs';
const baseline=JSON.parse(readFileSync('tests/fixtures/publishing-pilot/baseline.json'));
baseline.renderer=RENDERER;
const expected=JSON.parse(readFileSync('tests/fixtures/publishing-pilot/expected.json'));
let passed=0;const checks=[];
async function check(name,fn){await fn();passed++;checks.push(name);console.log('PASS',name);}
async function stage(p){return (await call('stage',{payload:p})).digest;}
async function qa(d,p){validateCandidate(p,baseline);return call('preflight',{digest:d,evidence:{passed:true,digest:d,fixture:'independent-expected-v1',editions:['loog','sunday-crew','doge']}},ACTORS.verifier);}
const b=await stage(baseline),c=await stage(correction(baseline)),r=await stage(rotation(baseline)),l=await stage(localFixture(baseline));
await check('no QA, wrong scope, forged QA and service role cannot publish',async()=>{
 await assert.rejects(call('approve_publish',{digest:b,expectedGeneration:0,requestId:randomUUID()}),/preflight/);
 await assert.rejects(call('approve',{digest:b,scope:'production'}),/staging scope/);
 await assert.rejects(call('preflight',{digest:b,evidence:{passed:true,digest:b}}),/verifier/);
 await assert.rejects(call('read',{edition:'loog'},ACTORS.owner,'service_role'),/permission denied/);
 await assert.rejects(call('read',{edition:'loog'},ACTORS.stranger),/permission/);
});
for(const [d,p] of [[b,baseline],[c,correction(baseline)],[r,rotation(baseline)],[l,localFixture(baseline)]])await qa(d,p);
const initial=await call('approve_publish',{digest:b,expectedGeneration:0,requestId:randomUUID()});
await check('complete approved baseline and fixed renderer',async()=>{
 const read=await call('read',{edition:'loog'});assert.equal(read.digest,b);assert.deepEqual(read.snapshot.home,expected.home);assert.equal(read.snapshot.articles[JAY].body.at(-1),expected.lastParagraph);
 await assert.rejects(call('read',{edition:'loog',renderer:'changed'}),/renderer mismatch/);
});
await check('concurrent CAS commits one winner; lost-response retry is idempotent',async()=>{
 const id1=randomUUID(),id2=randomUUID();const res=await Promise.allSettled([call('approve_publish',{digest:c,expectedGeneration:initial.generation,requestId:id1}),call('approve_publish',{digest:r,expectedGeneration:initial.generation,requestId:id2})]);
 assert.equal(res.filter(x=>x.status==='fulfilled').length,1);assert.match(res.find(x=>x.status==='rejected').reason.message,/stale generation/);
 const idx=res.findIndex(x=>x.status==='fulfilled'),digest=idx===0?c:r,id=idx===0?id1:id2;
 const repeat=await call('approve_publish',{digest,expectedGeneration:initial.generation,requestId:id});assert.equal(repeat.replayed,true);assert.equal(repeat.generation,2);
 await assert.rejects(call('approve_publish',{digest:b,expectedGeneration:2,requestId:id}),/idempotency conflict/);
});
await check('rollback exact baseline on same renderer with no deployment',async()=>{
 await call('approve_publish',{digest:b,expectedGeneration:2,requestId:randomUUID()});
 const read=await call('read',{edition:'doge'});assert.equal(read.renderer,RENDERER);assert.deepEqual(read.snapshot,baseline.editions.doge);
});
await check('revoked approval and stale approver grant block activation',async()=>{
 const a=await call('approve',{digest:l},ACTORS.local);await call('revoke',{digest:l,approval:a.approval},ACTORS.local);
 await assert.rejects(call('publish',{digest:l,expectedGeneration:3,requestId:randomUUID()}),/valid approval/);
 await call('approve',{digest:l},ACTORS.local);await sql(`update brief_pilot.access set version=version+1 where actor='${ACTORS.local}';`);
 await assert.rejects(call('publish',{digest:l,expectedGeneration:3,requestId:randomUUID()}),/valid approval/);
});
await check('local publisher cannot change shared editions; local-only release preserves others',async()=>{
 await assert.rejects(call('approve_publish',{digest:c,expectedGeneration:3,requestId:randomUUID()},ACTORS.local),/edition permission/);
 const result=await call('approve_publish',{digest:l,expectedGeneration:3,requestId:randomUUID()},ACTORS.local);assert.equal(result.generation,4);
 assert.deepEqual((await call('read',{edition:'loog'})).snapshot,baseline.editions.loog);
 assert.deepEqual((await call('read',{edition:'sunday-crew'})).snapshot,baseline.editions['sunday-crew']);
 await assert.rejects(call('read',{edition:'loog'},ACTORS.local),/edition permission/);
});
await check('direct immutable, pointer and approval writes fail; owner records immutable too',async()=>{
 for(const query of ["update brief_pilot.head set generation=99", "delete from brief_pilot.releases", "insert into brief_pilot.approvals(digest,actor,permission_version,scope) values('bad','"+ACTORS.owner+"',1,'staging')"]){await assert.rejects(sql('set role authenticated;'+query),/permission denied/);}
 await assert.rejects(sql(`update brief_pilot.releases set payload='{}' where digest=${quote(b)}`),/immutable/);
});
await check('read snapshots stay complete during activation; correction does not reorder',async()=>{
 await call('approve_publish',{digest:b,expectedGeneration:4,requestId:randomUUID()});
 const reads=Array.from({length:8},()=>call('read',{edition:'loog'}));reads.push(call('approve_publish',{digest:c,expectedGeneration:5,requestId:randomUUID()}));
 for(const read of (await Promise.all(reads)).slice(0,8))assert.deepEqual(read.snapshot,read.digest===b?baseline.editions.loog:correction(baseline).editions.loog);
 assert.deepEqual((await call('read',{edition:'loog'})).snapshot.home,expected.home);
});
await check('status requires independent verification and rejects superseded proof',async()=>{
 const id=randomUUID();await call('approve_publish',{digest:b,expectedGeneration:6,requestId:id});
 assert.equal((await call('status',{requestId:id})).state,'publishing');
 await assert.rejects(call('verify',{digest:b,requestId:id,evidence:{passed:true,digest:b}}),/verifier/);
 await call('verify',{digest:b,requestId:id,evidence:{passed:true,digest:b}},ACTORS.verifier);
 assert.equal((await call('status',{requestId:id})).state,'verified-live');
 await call('approve_publish',{digest:c,expectedGeneration:7,requestId:randomUUID()});
 await assert.rejects(call('verify',{digest:b,requestId:id,evidence:{passed:true,digest:b}},ACTORS.verifier),/superseded/);
});
await check('permission revocation blocks publisher and QA grant invalidation blocks approval',async()=>{
 await sql(`update brief_pilot.access set active=false where actor='${ACTORS.local}';`);
 await assert.rejects(call('approve',{digest:l},ACTORS.local),/permission/);
 await sql(`update brief_pilot.access set active=false where actor='${ACTORS.verifier}';`);
 await assert.rejects(call('approve',{digest:c}),/preflight/);
 await sql(`update brief_pilot.access set active=true where actor in ('${ACTORS.local}','${ACTORS.verifier}');`);
});
await call('approve_publish',{digest:b,expectedGeneration:8,requestId:randomUUID()});
writeFileSync('/tmp/brief-pilot-db-results.json',JSON.stringify({kind:'local-real-postgres-not-deployed-supabase',passed,checks,renderer:RENDERER,digests:{baseline:b,correction:c,rotation:r,local:l}},null,2));
console.log(passed,'database checks passed; baseline restored.');
