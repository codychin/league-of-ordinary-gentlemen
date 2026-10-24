import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {sql,call,ACTORS,RENDERER,quote} from './local-db.mjs';
const {digests}=JSON.parse(readFileSync('/tmp/brief-pilot-db-results.json'));
const restricted='00000000-0000-4000-8000-000000000005',replacement='00000000-0000-4000-8000-000000000007';
const checks=[];const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name)};
async function activate(digest){const h=await call('read',{edition:'loog'}),requestId=randomUUID();await call('approve_publish',{digest,expectedGeneration:h.generation,requestId});return requestId;}
await sql(`insert into brief_pilot.access(actor,editions,verifier) values('${restricted}',array['doge'],true),('${replacement}',array['loog','sunday-crew','doge'],true);`);
await check('DOGE-only verifier cannot certify a global activation',async()=>{
 const requestId=await activate(digests.correction);
 await assert.rejects(call('verify',{digest:digests.correction,requestId,evidence:{passed:true,digest:digests.correction}},restricted),/verification edition permission/);
 await call('verify',{digest:digests.correction,requestId,evidence:{passed:true,digest:digests.correction}},ACTORS.verifier);
});
await check('narrow prior QA cannot authorize global rollback; replacement appends valid QA',async()=>{
 await activate(digests.baseline);
 await call('preflight',{digest:digests.baseline,evidence:{passed:true,digest:digests.baseline,editions:['doge']}},restricted);
 await activate(digests.correction);
 await sql(`update brief_pilot.access set version=version+1,active=false where actor='${ACTORS.verifier}';`);
 await assert.rejects(call('approve',{digest:digests.baseline}),/valid exact preflight/);
 const previous=Number(await sql(`select count(*) from brief_pilot.qa where digest=${quote(digests.baseline)};`));
 const renewed=await call('preflight',{digest:digests.baseline,evidence:{passed:true,digest:digests.baseline,editions:['loog','sunday-crew','doge']}},replacement);
 assert.ok(renewed.attestation);assert.equal(Number(await sql(`select count(*) from brief_pilot.qa where digest=${quote(digests.baseline)};`)),previous+1);
 const requestId=await activate(digests.baseline);
 assert.equal(Number(await sql(`select qa_id from brief_pilot.activations where request_id=${quote(requestId)}::uuid;`)),renewed.attestation);
});
await check('current verifier edition scope is rechecked even without a version change',async()=>{
 await sql(`update brief_pilot.access set active=true where actor='${ACTORS.verifier}';`);
 await call('preflight',{digest:digests.correction,evidence:{passed:true,digest:digests.correction,editions:['loog','sunday-crew','doge']}},replacement);
 await sql(`update brief_pilot.access set editions=array['doge'] where actor='${replacement}';`);
 await assert.rejects(call('approve',{digest:digests.correction}),/valid exact preflight/);
 await sql(`update brief_pilot.access set editions=array['loog','sunday-crew','doge'] where actor='${replacement}';`);
});
await check('DOGE approver can revoke owned historical approval after unrelated global change',async()=>{
 await call('preflight',{digest:digests.local,evidence:{passed:true,digest:digests.local,editions:['loog','sunday-crew','doge']}},replacement);
 const approval=await call('approve',{digest:digests.local},ACTORS.local);
 await activate(digests.correction);
 const revoked=await call('revoke',{digest:digests.local,approval:approval.approval},ACTORS.local);assert.equal(revoked.revoked,approval.approval);
 await assert.rejects(call('revoke',{digest:digests.local,approval:approval.approval},ACTORS.owner),/approval owner/);
});
await check('SQL rejects mixed verifier capability and null grants',async()=>{
 for(const values of ['true,false,true','false,true,true'])await assert.rejects(sql(`insert into brief_pilot.access(actor,editions,approver,publisher,verifier) values('${randomUUID()}',array['doge'],${values});`),/check constraint/);
 await assert.rejects(sql(`update brief_pilot.access set verifier=null where actor='${restricted}';`),/not-null constraint/);
});
// Renew original verifier at its new version for later existing local runners.
for(const digest of Object.values(digests))await call('preflight',{digest,evidence:{passed:true,digest,editions:['loog','sunday-crew','doge']}},ACTORS.verifier);
await activate(digests.baseline);
writeFileSync('/tmp/brief-pilot-review-database.json',JSON.stringify({renderer:RENDERER,checks,passed:checks.length,kind:'real-disposable-postgres'},null,2));
