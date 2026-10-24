import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {call,sql,quote,ACTORS,RENDERER,CONTAINER} from './local-db.mjs';
import {sessionCookie} from './local-gateway.mjs';
const {digests}=JSON.parse(readFileSync('/tmp/brief-pilot-db-results.json'));
const before=await call('read',{edition:'loog'}),requestId=randomUUID();
const args={scope:'staging',renderer:RENDERER,digest:digests.correction,expectedGeneration:before.generation,requestId};
// Kill a real backend after the activation function returns but before COMMIT.
const pending=sql(`set application_name='brief-pilot-crash-test'; begin; set local role authenticated;
select set_config('request.jwt.claim.sub','${ACTORS.owner}',true);select set_config('request.jwt.claim.role','authenticated',true);
select public.brief_pilot_command('approve_publish',${quote(JSON.stringify(args))}::jsonb);select pg_sleep(20);commit;`).then(()=>false,()=>true);
let pid;
for(let i=0;i<30;i++){pid=await sql("select pid from pg_stat_activity where application_name='brief-pilot-crash-test' and wait_event='PgSleep';");if(pid)break;await new Promise(r=>setTimeout(r,100));}
assert.match(pid,/^\d+$/);await sql(`select pg_terminate_backend(${Number(pid)});`);assert.equal(await pending,true);
assert.equal((await call('read',{edition:'loog'})).generation,before.generation);
assert.equal((await call('status',{requestId})).committed,false);
const cookie=sessionCookie(),headers={Cookie:cookie.name+'='+cookie.value};
const locked=sql("begin; select * from brief_pilot.head for update; select pg_sleep(8); commit;");
await new Promise(r=>setTimeout(r,250));
const timeoutStart=performance.now();
const timed=await fetch('http://127.0.0.1:4320/publishing-pilot/loog',{headers,signal:AbortSignal.timeout(10000)});
assert.ok((await timed.text()).includes('Staging pilot unavailable'));
const timeoutMs=performance.now()-timeoutStart;assert.ok(timeoutMs>=4500&&timeoutMs<9000);await locked;
let elapsed;
execFileSync('docker',['pause',CONTAINER]);
try{const start=performance.now();const r=await fetch('http://127.0.0.1:4320/publishing-pilot/loog',{headers,signal:AbortSignal.timeout(10000)});const html=await r.text();elapsed=performance.now()-start;assert.ok(html.includes('Staging pilot unavailable'));assert.ok(!html.includes('data-pilot-release='));assert.ok(elapsed<9000);}finally{execFileSync('docker',['unpause',CONTAINER]);}
const recovered=await fetch('http://127.0.0.1:4320/publishing-pilot/loog',{headers});assert.ok((await recovered.text()).includes('data-pilot-release="'+before.digest+'"'));
writeFileSync('/tmp/brief-pilot-faults.json',JSON.stringify({kind:'local-real-postgres',renderer:RENDERER,checks:['backend terminated before commit: no activation','lost-response retry covered in database suite','locked database read: five-second timeout, no stale payload','database paused: bounded unavailable, no stale payload','recovery: original complete release'],outageResponseMs:elapsed,timeoutMs},null,2));
console.log('PASS pre-commit backend crash, bounded outage and recovery',Math.round(elapsed)+'ms');
