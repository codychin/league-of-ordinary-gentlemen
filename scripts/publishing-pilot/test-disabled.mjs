import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const report=[];
for(const mode of ['unconfigured','production-target-rejected']){
 const env={...process.env,BRIEF_PILOT_ENABLED:mode==='unconfigured'?'':'1',BRIEF_PILOT_ORIGIN:'http://127.0.0.1:4322',BRIEF_PILOT_SUPABASE_URL:'https://dnzdbqycuuoonewcowis.supabase.co',BRIEF_PILOT_PUBLISHABLE_KEY:'noncredential-fixture',BRIEF_PILOT_RENDERER_ID:'irrelevant'};
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','4322'],{env,stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Startup timed out')),10000);server.stdout.on('data',b=>{log+=b;if(log.includes('Ready')){clearTimeout(timer);resolve();}});server.on('error',reject);});
  const page=await fetch('http://127.0.0.1:4322/publishing-pilot/loog');const html=await page.text();assert.ok(html.includes('Staging pilot unavailable'));assert.ok(!html.includes('data-pilot-release='));
  const action=await fetch('http://127.0.0.1:4322/api/publishing-pilot',{method:'POST',headers:{Origin:'http://127.0.0.1:4322','Content-Type':'application/json'},body:JSON.stringify({op:'approve_publish',args:{requestId:randomUUID(),digest:'not-a-release',expectedGeneration:0}})});assert.equal(action.status,409);assert.equal((await action.json()).state,'recoverable-failure');
  report.push({mode,read:'unavailable',mutationStatus:409,passed:true});
 }finally{server.kill('SIGTERM');await new Promise(resolve=>server.on('exit',resolve));}
}
writeFileSync('/tmp/brief-pilot-disabled.json',JSON.stringify({kind:'local-built-next-runtime-no-valid-credentials',checks:report},null,2));console.log('PASS unconfigured runtime and production-target guard reject publication');
