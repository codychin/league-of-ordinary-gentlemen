import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {sessionCookie} from './local-gateway.mjs';
import {call,sql,quote,ACTORS,RENDERER} from './local-db.mjs';
const origin='http://127.0.0.1:4320',cookie=sessionCookie();
const {digests}=JSON.parse(readFileSync('/tmp/brief-pilot-db-results.json'));
const expected=JSON.parse(readFileSync('tests/fixtures/publishing-pilot/expected.json'));
const routes=['loog','sunday-crew','doge'].flatMap(e=>['/publishing-pilot/'+e,'/publishing-pilot/'+e+'/articles/'+expected.home[0]]);
const samples=[],ttfb=[],totals=[];
for(let i=0;i<20;i++){
 const digest=i%2===0?digests.correction:digests.baseline;
 const current=await call('read',{edition:'loog'}),id=randomUUID(),started=performance.now();
 const response=await fetch(origin+'/api/publishing-pilot',{method:'POST',headers:{Origin:origin,Cookie:cookie.name+'='+cookie.value,'Content-Type':'application/json'},body:JSON.stringify({op:'approve_publish',args:{digest,expectedGeneration:current.generation,requestId:id}})});
 assert.equal(response.status,200);assert.equal((await response.json()).committed,true);
 for(const route of routes){const start=performance.now();const r=await fetch(origin+route,{headers:{Cookie:cookie.name+'='+cookie.value}});ttfb.push(performance.now()-start);assert.equal(r.status,200);const html=await r.text();totals.push(performance.now()-start);assert.ok(html.includes('data-pilot-release="'+digest+'"'));assert.ok(html.includes('data-pilot-renderer="'+RENDERER+'"'));assert.ok(!html.includes('Staging pilot unavailable'));if(route.includes('/articles/'))assert.equal(html.includes('[STAGING CORRECTION]'),i%2===0);}
 const approved=await sql(`select a.created_at from brief_pilot.approvals a join brief_pilot.activations x on x.approval=a.id where x.request_id=${quote(id)}::uuid;`);
 const approvedToVerifiedMs=Date.now()-Date.parse(approved);
 await call('verify',{digest,requestId:id,evidence:{passed:true,digest,routes,kind:'local-http-only'}},ACTORS.verifier);
 samples.push({digest,approvedToVerifiedMs,requestToVerificationMs:performance.now()-started});
}
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
const report={kind:'local-next-real-postgres-synthetic-auth-not-hosted-staging',renderer:RENDERER,successfulTrials:20,routes,approvedToVerifiedMs:{median:percentile(samples.map(s=>s.approvedToVerifiedMs),.5),p95:percentile(samples.map(s=>s.approvedToVerifiedMs),.95)},ttfbMs:{median:percentile(ttfb,.5),p95:percentile(ttfb,.95)},responseTotalMs:{median:percentile(totals,.5),p95:percentile(totals,.95)},load:{renderedReads:120,activationRequests:20,independentVerificationWrites:20,headReadsForTestSetup:20,approvalTimestampQueries:20},samples};
writeFileSync('/tmp/brief-pilot-timing.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,samples:undefined},null,2));
