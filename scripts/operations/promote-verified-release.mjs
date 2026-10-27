#!/usr/bin/env node
// Fail closed: exact main SHA, both GitHub QA jobs, provider checks, staged routes.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync,appendFileSync} from 'node:fs';
import {promotionDecision} from './promotion-state.mjs';
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
const receipt={sha,projectId:project,runId:process.env.GITHUB_RUN_ID||null,attempt:process.env.GITHUB_RUN_ATTEMPT||null,state:'inspecting'};
function record(state,extra={}){
 Object.assign(receipt,extra,{state,updatedAt:new Date().toISOString()});
 writeFileSync(process.env.RELEASE_RECEIPT_PATH||'release-receipt.json',JSON.stringify(receipt,null,2));
 console.log('RELEASE_STATE',JSON.stringify(receipt));
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,`Release ${sha}: **${state}**. Owner: release operator; run ${receipt.runId}.\n`);
}
process.on('exit',code=>{if(code!==0)record('needs-reconciliation',{lastState:receipt.state});});
record('inspecting');
async function request(path,options={}){
 const r=await fetch('https://api.vercel.com'+path+(path.includes('?')?'&':'?')+'teamId='+team,{
  ...options,redirect:'error',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Vercel API HTTP '+r.status);
 const body=await r.text();
 if(!body.trim()){
  assert.notEqual(options.method||'GET','GET','Vercel inspection returned no JSON');
  return {}; // Successful mutation endpoints may acknowledge with HTTP 204.
 }
 try{return JSON.parse(body)}catch{throw Error('Vercel API returned invalid JSON')}
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
function validateProviderChecks(deployment){
 if(deployment.checks!==undefined){
  assert.equal(deployment.checks?.deploymentAlias?.state,'succeeded','Provider Deployment Checks must succeed');
 }else if(deployment.checksState!==undefined||deployment.checksConclusion!==undefined){
  assert.equal(deployment.checksState,'completed','Provider checks must complete');
  assert.equal(deployment.checksConclusion,'succeeded','Provider checks must succeed');
 }else{
  // Vercel does not attach promotion checks when auto-assignment is disabled.
  // Manual mode is asserted before staging and again immediately before POST;
  // direct exact-SHA GitHub checks and staged routes remain mandatory.
  console.log('Manual assignment: exact-SHA GitHub QA is the release authority; no provider check run attached');
 }
}
await validateQA();
const policy=await request('/v9/projects/'+project);
assert.equal(policy.id,project);
assert.equal(policy.accountId,team,'Wrong Vercel team');
// Manual assignment is checked after identifying an exact candidate; narrowly
// scoped interrupted-success recovery may restore it before continuing.
const previous=await request('/v13/deployments/'+domain);
record('waiting-for-build',{previousId:previous.id});
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
validateProviderChecks(candidate);
record('candidate-ready',{candidateId:id,previousId:previous.id===id?(policy.lastAliasRequest?.fromDeploymentId||null):previous.id});
if(policy.autoAssignCustomDomains!==false){
 assert.equal(mode,'promote','Verification cannot repair policy');
 assert.equal(policy.lastAliasRequest?.type,'promote','Unknown assignment-policy change');
 assert.equal(policy.lastAliasRequest?.toDeploymentId,id,'Policy recovery is limited to this candidate');
 assert.equal(policy.lastAliasRequest?.jobStatus,'succeeded','Unfinished provider operation requires reconciliation');
 assert.equal(previous.id,id,'Policy recovery requires candidate already live');
 await request('/v9/projects/'+project,{method:'PATCH',body:JSON.stringify({autoAssignCustomDomains:false})});
 assert.equal((await request('/v9/projects/'+project)).autoAssignCustomDomains,false,'Manual assignment recovery failed');
 record('policy-restored-after-interruption');
}
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
validateProviderChecks(latest);
assert.equal((await request('/v9/projects/'+project)).autoAssignCustomDomains,false);
if(mode==='verify-only'){
 record('staged-verified');
 console.log('STAGED VERIFIED',id,'commit',sha,'production remains',previous.id);
 process.exit(0);
}
let decision;
for(let i=0;i<24;i++){
 const state=await request('/v9/projects/'+project);
 const live=await request('/v13/deployments/'+domain);
 decision=promotionDecision({request:state.lastAliasRequest,live,candidateId:id,sha});
 if(decision.action!=='wait')break;
 record('waiting-for-provider-operation',{providerRequest:state.lastAliasRequest});
 await sleep(10000);
}
assert.ok(['promote','verify'].includes(decision.action),'Provider operation unresolved: '+decision.reason);
if(decision.action==='promote'){
 await validateQA();
 record('promotion-request-started');
 try{
  await request('/v10/projects/'+project+'/promote/'+id,{method:'POST',body:'{}'});
  record('promotion-request-acknowledged');
 }catch{
  // Never repeat POST here: inspect provider operation and actual alias instead.
  record('promotion-request-outcome-uncertain');
 }finally{
  await request('/v9/projects/'+project,{method:'PATCH',body:JSON.stringify({autoAssignCustomDomains:false})});
  assert.equal((await request('/v9/projects/'+project)).autoAssignCustomDomains,false,'Manual assignment was not restored');
  record('policy-restored');
 }
}else record('already-live-no-duplicate-request');
let verified=false;
for(let i=0;i<24;i++){
 const state=await request('/v9/projects/'+project);
 const live=await request('/v13/deployments/'+domain);
 const resolved=promotionDecision({request:state.lastAliasRequest,live,candidateId:id,sha});
 if(resolved.action==='verify'&&state.autoAssignCustomDomains===false){verified=true;break;}
 if(resolved.action==='stop')break;
 await sleep(10000);
}
assert.ok(verified,'Live alias or provider operation unresolved; no duplicate promotion requested');
record('alias-verified');
console.log('VERIFIED production domain',domain,'commit',sha,'deployment',id);
