// Run ONLY against the original disposable pilot schema, before applying repairs.
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {sql,call,ACTORS,quote} from './local-db.mjs';
const {digests}=JSON.parse(readFileSync('/tmp/brief-pilot-db-results.json'));
const restricted='00000000-0000-4000-8000-000000000005',mixed='00000000-0000-4000-8000-000000000006';
const evidence={schema:'original faaa10f disposable local database',findings:[]};
await sql(`insert into brief_pilot.access(actor,editions,verifier) values('${restricted}',array['doge'],true);`);
let head=await call('read',{edition:'loog'});const globalRequest=randomUUID();
await call('approve_publish',{digest:digests.correction,expectedGeneration:head.generation,requestId:globalRequest});
const unauthorized=await call('verify',{digest:digests.correction,requestId:globalRequest,evidence:{passed:true,digest:digests.correction}},restricted);
evidence.findings.push({issue:1,expected:'reject restricted verifier for global activation',observed:unauthorized});
await sql(`update brief_pilot.access set version=version+1 where actor='${ACTORS.verifier}';`);
const misleading=await call('preflight',{digest:digests.baseline,evidence:{passed:true,digest:digests.baseline}},ACTORS.verifier);
try{await call('approve',{digest:digests.baseline});throw Error('Expected original renewal failure');}catch(error){evidence.findings.push({issue:2,expected:'renew QA then approve baseline',preflightResponse:misleading,observed:error.message});}
await sql(`update brief_pilot.access set version=version-1 where actor='${ACTORS.verifier}';`);
head=await call('read',{edition:'loog'});await call('approve_publish',{digest:digests.baseline,expectedGeneration:head.generation,requestId:randomUUID()});
const approval=await call('approve',{digest:digests.local},ACTORS.local);
head=await call('read',{edition:'loog'});await call('approve_publish',{digest:digests.correction,expectedGeneration:head.generation,requestId:randomUUID()});
try{await call('revoke',{digest:digests.local,approval:approval.approval},ACTORS.local);throw Error('Expected original historical revocation failure');}catch(error){evidence.findings.push({issue:3,expected:'owner can revoke historical approval',observed:error.message});}
await sql(`insert into brief_pilot.access(actor,editions,approver,publisher,verifier) values('${mixed}',array['doge'],true,true,true);`);
evidence.findings.push({issue:5,expected:'reject combined verifier and publisher/approver capability',observed:'INSERT succeeded'});
writeFileSync('docs/publishing-pilot/review-evidence/simone-original-counterexamples.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
