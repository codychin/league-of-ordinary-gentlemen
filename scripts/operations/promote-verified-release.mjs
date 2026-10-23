#!/usr/bin/env node
// Fail closed: exact main SHA, both GitHub QA jobs, provider checks, staged routes.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const token=process.env.VERCEL_TOKEN;
const ghToken=process.env.GH_TOKEN;
const project='prj_h89MCmxn3Mr3O0wRpnwstM917E0l';
const team='team_hU7RX1oX9Ea0W2U9ieHwNxzL';
const repo='codychin/league-of-ordinary-gentlemen';
const domain='www.ordinarybrief.com';
const sha=process.env.RELEASE_SHA;
const mode=process.env.RELEASE_MODE||'verify-only';
assert.ok(['verify-only','promote'].includes(mode),'Invalid release mode');
assert.ok(token&&ghToken,'Vercel and GitHub credentials required; release NOT promoted');
assert.match(sha||'',/^[0-9a-f]{40}$/,'Expected exact RELEASE_SHA');
assert.ok(!process.env.VERCEL_PROJECT_ID||process.env.VERCEL_PROJECT_ID===project,'Wrong production project');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function request(path,options={}){
 const r=await fetch('https://api.vercel.com'+path+(path.includes('?')?'&':'?')+'teamId='+team,{
  ...options,redirect:'error',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Vercel API HTTP '+r.status);
 return r.json();
}
async function github(path){
 const r=await fetch('https://api.github.com/repos/'+repo+path,{redirect:'error',headers:{Authorization:'Bearer '+ghToken,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('GitHub API HTTP '+r.status);
 return r.json();
}
async function validateQA(){
 assert.equal((await github('/branches/main')).commit.sha,sha,'Superseded main commit');
 const checks=(await github('/commits/'+sha+'/check-runs?per_page=100')).check_runs;
 assert.ok(Array.isArray(checks),'Missing GitHub checks');
 for(const name of ['integrity','article-image-qa']){
  const latest=checks.filter(c=>c.name===name&&c.app?.slug==='github-actions').sort((a,b)=>b.id-a.id)[0];
  assert.ok(latest&&latest.head_sha===sha&&latest.status==='completed'&&latest.conclusion==='success','Required QA not successful: '+name);
 }
}
await validateQA();
const policy=await request('/v9/projects/'+project);
assert.equal(policy.id,project);
assert.equal(policy.accountId,team,'Wrong Vercel team');
assert.equal(policy.autoAssignCustomDomains,false,'Automatic production assignment must remain disabled');
const previous=await request('/v13/deployments/'+domain);
console.log('Recorded current production deployment',previous.id);
let build;
for(let i=0;i<40;i++){
 const result=await request('/v6/deployments?'+new URLSearchParams({projectId:project,target:'production',sha,limit:'100'}));
 build=(result.deployments||[]).filter(x=>x.meta?.githubCommitSha===sha&&x.meta?.githubCommitRef==='main').sort((a,b)=>b.created-a.created)[0];
 if(['ERROR','CANCELED'].includes(build?.state))throw Error('Candidate build failed');
 if(build?.state==='READY')break;
 await sleep(15000);
}
assert.equal(build?.state,'READY','Exact candidate never became READY');
const id=build.uid||build.id;
const candidate=await request('/v13/deployments/'+id);
assert.equal(candidate.projectId,project);
assert.equal(candidate.target,'production');
assert.equal(candidate.meta?.githubCommitSha,sha);
assert.equal(candidate.meta?.githubCommitRef,'main');
assert.equal(candidate.readyState,'READY');
assert.equal(candidate.checks?.deploymentAlias?.state,'succeeded','Provider Deployment Checks must succeed');
const origin='https://'+candidate.url;
const url=new URL(origin);
assert.equal(url.origin,origin);
assert.ok(url.hostname.endsWith('.vercel.app'));
assert.ok(!url.username&&!url.password);
// Request a short-lived GitHub identity only after verifying the destination.
assert.ok(process.env.ACTIONS_ID_TOKEN_REQUEST_URL&&process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,'GitHub identity token permission required');
const identity=await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL,{redirect:'error',headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},signal:AbortSignal.timeout(20000)});
assert.ok(identity.ok,'GitHub identity request failed');
const oidc=(await identity.json()).value;
assert.ok(typeof oidc==='string'&&oidc.length>0,'Missing GitHub identity token');
const smoke=spawnSync(process.execPath,[new URL('./check-public-routes.mjs',import.meta.url).pathname],{
 env:{PATH:process.env.PATH,NODE_OPTIONS:process.env.NODE_OPTIONS||'',BASE_URL:origin,VERCEL_TRUSTED_OIDC_TOKEN:oidc,RELEASE_CANARY_FAIL:process.env.RELEASE_CANARY_FAIL||''},encoding:'utf8',timeout:150000});
process.stdout.write(smoke.stdout||'');
assert.equal(smoke.status,0,'Staged candidate routes failed; release NOT promoted');
await validateQA();
const latest=await request('/v13/deployments/'+id);
assert.equal(latest.checks?.deploymentAlias?.state,'succeeded','Provider checks changed before promotion');
assert.equal((await request('/v9/projects/'+project)).autoAssignCustomDomains,false);
if(mode==='verify-only'){
 console.log('STAGED VERIFIED',id,'commit',sha,'production remains',previous.id);
 process.exit(0);
}
try{
 await request('/v10/projects/'+project+'/promote/'+id,{method:'POST',body:'{}'});
}finally{
 // Vercel promotion can re-enable automatic assignment (vercel/vercel#15095).
 // Restore manual assignment even when the promotion response fails or times out.
 await request('/v9/projects/'+project,{method:'PATCH',body:JSON.stringify({autoAssignCustomDomains:false})});
 assert.equal((await request('/v9/projects/'+project)).autoAssignCustomDomains,false,'Manual assignment was not restored');
}
let verified=false;
for(let i=0;i<24;i++){
 const live=await request('/v13/deployments/'+domain);
 if(live.id===id&&live.meta?.githubCommitSha===sha&&live.readyState==='READY'){verified=true;break;}
 await sleep(10000);
}
assert.ok(verified,'Live alias identity mismatch; release NOT verified');
console.log('VERIFIED production domain',domain,'commit',sha,'deployment',id);
