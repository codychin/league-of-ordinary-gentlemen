#!/usr/bin/env node
// Explicit, audited publish path. Requires VERCEL_TOKEN configured as GitHub Actions secret.
// No "published" status until the public alias and live content pass validation.
// Usage: VERCEL_TOKEN=... RELEASE_SHA=... STAGING_URL=... node scripts/operations/promote-release.mjs
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const token=process.env.VERCEL_TOKEN,sha=process.env.RELEASE_SHA,stage=process.env.STAGING_URL;
const project='prj_h89MCmxn3Mr3O0wRpnwstM917E0l',team='team_hU7RX1oX9Ea0W2U9ieHwNxzL';
const canonical='www.ordinarybrief.com';
if(!token||!sha||!stage)throw Error('VERCEL_TOKEN, RELEASE_SHA, STAGING_URL are all required');
assert.match(sha,/^[0-9a-f]{40}$/i);
const stageHost=new URL(stage);if(stageHost.protocol!=='https:'||!stageHost.hostname.endsWith('.vercel.app'))throw Error('Staging must be an exact Vercel HTTPS preview');
const api='https://api.vercel.com';
async function vercel(method,path,body){
 const res=await fetch(api+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const text=await res.text();let json;try{json=JSON.parse(text)}catch{throw Error(`Vercel ${method} ${path}: unparseable ${res.status}`)}
 if(!res.ok)throw Error(`Vercel ${method} ${path}: ${res.status} ${JSON.stringify(json.error||json).slice(0,500)}`);
 return json;
}
const qs='?teamId='+team;
async function alias(){
 const a=await vercel('GET',`/v4/aliases/${canonical}${qs}`);
 return a.deploymentId||a.deployment?.id;
}
async function deployment(id){
 const d=await vercel('GET',`/v13/deployments/${id}${qs}`);
 return d;
}
function smoke(base){
 const x=spawnSync(process.execPath,['scripts/operations/release-smoke.mjs'],{
  stdio:'inherit',env:{...process.env,BASE_URL:base,EXPECTED_SHA:sha,RELEASE_MODE:base.includes(canonical)?'production':'preview'}
 });
 if(x.status!==0)throw Error('Release smoke check failed for '+base);
}
console.log('Preflight: verify staging exact SHA and required pages');
smoke(stage);
const previous=await alias();assert.ok(previous,'Cannot determine existing production release for rollback');
console.log('Prior production deployment:',previous);
const created=await vercel('POST','/v13/deployments'+qs,{
 name:'league-of-ordinary-gentlemen',project,target:'production',
 gitSource:{type:'github',org:'codychin',repo:'league-of-ordinary-gentlemen',ref:'staging',sha}
});
const id=created.id||created.deployment?.id;
if(!id)throw Error('No deployment ID returned');
console.log('Production build:',id);
let state='INITIALIZING';
for(let i=0;i<60;i++){
 await new Promise(resolve=>setTimeout(resolve,10000));
 const d=await deployment(id);
 state=d.readyState||d.state;
 if(state==='READY')break;
 if(['ERROR','CANCELED','BLOCKED'].includes(state))throw Error('Deployment failed: '+state);
}
if(state!=='READY')throw Error('Build timed out — refusing promotion');
console.log('Build READY. Promote explicitly:',id);
await vercel('POST',`/v10/projects/${project}/promote/${id}${qs}`,{});
try{
 let active;
 for(let i=0;i<12;i++){
  active=await alias();if(active===id)break;
  await new Promise(resolve=>setTimeout(resolve,3000));
 }
 assert.equal(active,id,'Canonical alias did not switch');
 smoke('https://'+canonical);
 console.log('PUBLISHED: exact SHA and public routes confirmed',sha,id);
}catch(err){
 console.error('Post-release verification failed, restoring previous deployment:',err.message);
 try{
  await vercel('POST',`/v10/projects/${project}/promote/${previous}${qs}`,{});
  const restored=await alias();
  if(restored!==previous)console.error('ROLLBACK NOT CONFIRMED — immediate manual intervention needed');
  else console.error('Rollback alias confirmed:',previous);
 }catch(rollbackError){console.error('ROLLBACK FAILED — immediate manual intervention:',rollbackError.message)}
 process.exitCode=1;
}
