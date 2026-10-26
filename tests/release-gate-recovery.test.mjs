import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {validatePublicPage} from '../scripts/operations/public-route-validation.mjs';
const good='<html><body><h1>The Juice Box Guy</h1><p>The Brief</p><script>self.__next_f.push(["404: This page could not be found."])</script></body></html>';
test('inert Next.js not-found data does not mark valid content missing',()=>validatePublicPage(200,good,{article:true,expectedTitle:'The Juice Box Guy'}));
for(const html of ['<h1>The Brief</h1><p>Story not found.</p>','<h1>The Brief</h1><p>404: This page could not be found.</p>','<h1>Authentication Required</h1>','<script>The Brief</script>'])test('reject actual missing/protected content '+html.slice(0,30),()=>assert.throws(()=>validatePublicPage(200,html,{article:true})));
test('HTTP errors remain failures',()=>assert.throws(()=>validatePublicPage(404,good)));
test('wrong article title remains failure',()=>assert.throws(()=>validatePublicPage(200,good,{article:true,expectedTitle:'Wrong story'})));
test('article headline remains required',()=>assert.throws(()=>validatePublicPage(200,'The Brief',{article:true})));
const sha='a'.repeat(40);
const project='prj_h89MCmxn3Mr3O0wRpnwstM917E0l';
const team='team_hU7RX1oX9Ea0W2U9ieHwNxzL';
function simulate(mode,extra={}){
 const dir=mkdtempSync(join(tmpdir(),'brief-gate-'));
 try{
  const log=join(dir,'calls.jsonl');
  const preload=join(dir,'mock.mjs');
  writeFileSync(preload,`
   import {appendFileSync} from 'node:fs';
   const mode=${JSON.stringify(mode)};
   const sha='${sha}';
   let branchReads=0,aliasReads=0,detailReads=0,autoAssign=mode==='interrupted-policy',promoted=mode==='interrupted-policy';
   globalThis.setTimeout=f=>{queueMicrotask(f);return 0};
   globalThis.fetch=async (input,options={})=>{
    const u=new URL(input);
    const path=u.pathname;
    if(u.hostname==='oidc.actions.example')return Response.json({value:'test-oidc'});
    if(options.headers?.['x-vercel-trusted-oidc-idp-token']&&u.hostname!=='candidate.vercel.app')throw Error('Identity sent to wrong origin');
    appendFileSync(${JSON.stringify(log)},JSON.stringify({host:u.hostname,path,method:options.method||'GET'})+'\\n');
    if(u.hostname==='candidate.vercel.app'){
     if(options.headers?.['x-vercel-trusted-oidc-idp-token']!=='test-oidc')throw Error('Missing scoped identity');
     if(options.redirect!=='manual')throw Error('Credential-bearing redirects must be disabled');
     return new Response(${JSON.stringify(good)},{status:mode==='bad-routes'?403:200});
    }
    if(u.hostname==='api.github.com'){
     if(path.endsWith('/branches/main'))return Response.json({commit:{sha:mode==='obsolete'||(mode==='changed-main'&&++branchReads>1)?'b'.repeat(40):sha}});
     if(path.endsWith('/check-runs'))return Response.json({check_runs:['integrity','article-image-qa'].map((name,i)=>({id:i+1,name,app:{slug:mode==='wrong-check-app'?'other':'github-actions'},head_sha:sha,status:'completed',conclusion:mode.endsWith('failed-qa')&&i===1?'failure':'success'}))});
    }
    if(u.hostname!=='api.vercel.com')throw Error('Unexpected origin');
    if(path.startsWith('/v9/projects/')){
     if(mode==='empty-get'&&options.method!=='PATCH')return new Response(null,{status:204});
     if(mode==='invalid-json'&&options.method!=='PATCH')return new Response('sensitive-fixture-do-not-log',{status:200});
     if(options.method==='PATCH'&&mode!=='restore-fails')autoAssign=false;
     if(options.method==='PATCH')return new Response(null,{status:204});
     return Response.json({id:'${project}',accountId:'${team}',autoAssignCustomDomains:mode==='autoassign'||autoAssign,lastAliasRequest:mode==='interrupted-policy'?{type:'promote',jobStatus:'succeeded',toDeploymentId:'dpl_candidate',fromDeploymentId:'dpl_old'}:mode==='provider-active'?{type:'promote',jobStatus:'in-progress',toDeploymentId:'older'}:undefined});
    }
    if(path==='/v6/deployments')return Response.json({deployments:[{id:'dpl_candidate',created:1,state:mode==='failed-build'?'ERROR':'READY',meta:{githubCommitSha:mode==='wrong-sha'?'b'.repeat(40):sha,githubCommitRef:'main'}}]});
    if(path.endsWith('/www.ordinarybrief.com'))return Response.json({id:mode==='already-live'||promoted?(mode==='bad-alias'?'dpl_wrong':'dpl_candidate'):'dpl_old',readyState:'READY',meta:{githubCommitSha:sha}});
    if(path==='/v13/deployments/dpl_candidate')return Response.json({id:'dpl_candidate',projectId:mode==='wrong-project'?'other':'${project}',target:mode==='preview'?'preview':'production',readyState:'READY',url:mode==='foreign-url'?'evil.example':'candidate.vercel.app',meta:{githubCommitSha:sha,githubCommitRef:'main'},checks:mode.startsWith('no-provider')?undefined:{deploymentAlias:{state:mode==='failed-checks'||(mode==='changed-checks'&&++detailReads>1)?'failed':'succeeded'}}});
    if(path.endsWith('/promote/dpl_candidate')&&options.method==='POST'){
     autoAssign=true; promoted=mode!=='promote-error';
     return mode==='promote-error'||mode==='lost-response'?Response.json({}, {status:500}):new Response(null,{status:204});
    }
    throw Error('Unexpected request '+path);
   };
  `);
  const result=spawnSync(process.execPath,[resolve('scripts/operations/promote-verified-release.mjs')],{encoding:'utf8',timeout:10000,env:{...process.env,RELEASE_RECEIPT_PATH:join(dir,'receipt.json'),RELEASE_SHA:sha,RELEASE_MODE:'promote',VERCEL_PROJECT_ID:project,VERCEL_TOKEN:'test-vercel',GH_TOKEN:'test-github',ACTIONS_ID_TOKEN_REQUEST_URL:'https://oidc.actions.example/token',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'test-request',NODE_OPTIONS:'--import='+preload,...extra}});
  assert.equal(result.error,undefined,result.error?.message);
  const calls=readFileSync(log,'utf8').trim().split('\n').map(JSON.parse);
  assert.ok(!(result.stdout+result.stderr).includes('test-vercel'));
  assert.ok(!(result.stdout+result.stderr).includes('test-oidc'));
  assert.ok(!(result.stdout+result.stderr).includes('sensitive-fixture-do-not-log'));
  return {...result,calls};
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test('successful exact SHA promotes only after candidate route validation',()=>{
 const r=simulate('success');assert.equal(r.status,0,r.stderr);
 const post=r.calls.findIndex(c=>c.method==='POST');
 assert.ok(post>r.calls.findLastIndex(c=>c.host==='candidate.vercel.app'));
 assert.equal(r.calls[post+1].method,'PATCH');
 assert.ok(r.calls[post+2].path.startsWith('/v9/projects/'));
 assert.match(r.stdout,/VERIFIED production domain/);
});
for(const mode of ['obsolete','changed-main','failed-qa','wrong-check-app','autoassign','failed-build','wrong-sha','wrong-project','preview','foreign-url','failed-checks','changed-checks','bad-routes'])test('fail closed before any promotion: '+mode,()=>{
 const r=simulate(mode);assert.notEqual(r.status,0,r.stdout);assert.equal(r.calls.filter(c=>c.method==='POST').length,0);assert.doesNotMatch(r.stdout,/VERIFIED production domain/);
});
test('wrong live alias cannot be marked verified',()=>{const r=simulate('bad-alias');assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/VERIFIED production domain/)});
test('default verification mode never requests promotion',()=>{const r=simulate('success',{RELEASE_MODE:''});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/STAGED VERIFIED/);assert.equal(r.calls.filter(c=>c.method==='POST').length,0)});
test('intentional staging canary fails without promotion',()=>{const r=simulate('success',{RELEASE_CANARY_FAIL:'1'});assert.notEqual(r.status,0);assert.equal(r.calls.filter(c=>c.method==='POST').length,0)});
test('failed promotion still restores manual assignment',()=>{const r=simulate('promote-error');assert.notEqual(r.status,0);const post=r.calls.findIndex(c=>c.method==='POST');assert.equal(r.calls[post+1].method,'PATCH');assert.doesNotMatch(r.stdout,/VERIFIED production domain/)});
test('failed policy restoration cannot be marked verified',()=>{const r=simulate('restore-fails');assert.notEqual(r.status,0);assert.doesNotMatch(r.stdout,/VERIFIED production domain/)});
test('manual mode without attached provider checks still requires exact QA and staged routes',()=>{const r=simulate('no-provider');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/VERIFIED production domain/);assert.equal(r.calls.filter(c=>c.host==='candidate.vercel.app').length,6)});
test('missing provider checks never permit failed GitHub QA',()=>{const r=simulate('no-provider-failed-qa');assert.notEqual(r.status,0);assert.equal(r.calls.filter(c=>c.method==='POST').length,0)});
for(const mode of ['empty-get','invalid-json'])test('inspection fails closed without disclosing bodies: '+mode,()=>{const r=simulate(mode);assert.notEqual(r.status,0);assert.equal(r.calls.filter(c=>c.method==='POST').length,0)});

test('already-live candidate is verified without duplicate promotion',()=>{const r=simulate('already-live');assert.equal(r.status,0,r.stderr);assert.equal(r.calls.filter(c=>c.method==='POST').length,0);assert.match(r.stdout,/already-live-no-duplicate/)});
test('lost response reconciles applied alias without repeating request',()=>{const r=simulate('lost-response');assert.equal(r.status,0,r.stderr);assert.equal(r.calls.filter(c=>c.method==='POST').length,1);assert.match(r.stdout,/outcome-uncertain/);assert.match(r.stdout,/VERIFIED production domain/)});

test('interrupted applied promotion restores only the known candidate policy and does not repeat POST',()=>{const r=simulate('interrupted-policy');assert.equal(r.status,0,r.stderr);assert.equal(r.calls.filter(c=>c.method==='POST').length,0);assert.ok(r.calls.some(c=>c.method==='PATCH'));assert.match(r.stdout,/policy-restored-after-interruption/)});
test('active provider operation blocks new POST through bounded reconciliation',()=>{const r=simulate('provider-active');assert.notEqual(r.status,0);assert.equal(r.calls.filter(c=>c.method==='POST').length,0);assert.match(r.stdout,/waiting-for-provider-operation/)});
