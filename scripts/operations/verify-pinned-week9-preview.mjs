import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {verifyHostedWeek9Media,AUTH_HEADER} from './verify-hosted-week9-media.mjs';
export const PIN=Object.freeze({repo:'codychin/league-of-ordinary-gentlemen',sha:'490762295f23b226f00bca44e60cd2fc20d3da5b',tree:'9d537cd90c3a35ed77e2b053155708c50e75afd3',deployment:'dpl_46w9GT39YDdZJjFhedg65e58LLBn',project:'prj_h89MCmxn3Mr3O0wRpnwstM917E0l',team:'team_hU7RX1oX9Ea0W2U9ieHwNxzL',host:'league-of-ordinary-gentlemen-447f9nz2z-codychin1-8195.vercel.app'});
export function validateDeployment(d){
 assert.equal(d.id,PIN.deployment);assert.equal(d.projectId,PIN.project);assert.equal(d.team?.id||d.ownerId,PIN.team);
 assert.equal(d.readyState,'READY');assert.ok(d.target===null||d.target==='preview');
 assert.equal(d.url,PIN.host);assert.equal(d.meta?.githubCommitSha,PIN.sha);
 assert.equal(d.meta?.githubOrg,'codychin');assert.equal(d.meta?.githubRepo,'league-of-ordinary-gentlemen');
}
export async function verifyPinnedPreview(env=process.env){
 assert.equal(env.GITHUB_REPOSITORY,PIN.repo);assert.equal(env.GITHUB_REF,'refs/heads/main');assert.equal(env.GITHUB_EVENT_NAME,'workflow_dispatch');
 const get=async(url,token)=>{assert.ok(token);const response=await fetch(url,{redirect:'error',headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(20000)});assert.equal(response.status,200,'Identity lookup failed');return response.json();};
 const deployment=await get('https://api.vercel.com/v13/deployments/'+PIN.deployment+'?teamId='+PIN.team,env.VERCEL_TOKEN);validateDeployment(deployment);
 const gh='https://api.github.com/repos/'+PIN.repo;
 const commit=await get(gh+'/git/commits/'+PIN.sha,env.GH_TOKEN);assert.equal(commit.tree.sha,PIN.tree);
 // Only inert JSON from the candidate is inspected. Never execute its code.
 for(const file of ['data/week9-approved-homepage-media.json','qa/week9-owner-playback-waiver.json','qa/week9-packaged-media.json']){
  const remote=await get(gh+'/contents/'+file+'?ref='+PIN.sha,env.GH_TOKEN);
  assert.equal(remote.encoding,'base64');assert.deepEqual(JSON.parse(Buffer.from(remote.content,'base64')),JSON.parse(readFileSync(file,'utf8')),'Candidate media evidence changed');
 }
 const developmentToken=env.VERCEL_OIDC_TOKEN;assert.ok(typeof developmentToken==='string'&&developmentToken.length>20,'VERCEL_DEVELOPMENT_OIDC_TOKEN_MISSING');
 const origin='https://'+PIN.host;
 // Diagnose protection without following redirects or printing credentials/URLs.
 const probe=await fetch(origin+'/',{redirect:'manual',headers:{[AUTH_HEADER]:developmentToken},signal:AbortSignal.timeout(20000)});
 const location=probe.headers.get('location');
 const sso=location?new URL(location,origin).hostname==='vercel.com':false;
 console.log('Pinned preview authenticated GET: status='+probe.status+'; redirectsToVercel='+sso);
 await probe.body?.cancel();
 assert.equal(probe.status,200,'PINNED_PREVIEW_AUTHENTICATED_GET_FAILED');
 // Read-only verification: no promotion API, alias changes, or protection changes.
 return verifyHostedWeek9Media({BASE_URL:origin,VERIFIED_CANDIDATE_ORIGIN:origin,RELEASE_SHA:PIN.sha,VERCEL_TRUSTED_OIDC_TOKEN:developmentToken});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{await verifyPinnedPreview();console.log('Pinned preview playback verified; production unchanged.');}catch(e){console.error('Pinned preview verification failed:',e.message);process.exitCode=1;}}
