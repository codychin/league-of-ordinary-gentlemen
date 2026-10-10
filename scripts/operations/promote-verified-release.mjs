#!/usr/bin/env node
// Promote only the reviewed Vercel production build for this exact main-branch SHA.
// Required GitHub Actions secrets: VERCEL_TOKEN. The workflow fails closed.
const token=process.env.VERCEL_TOKEN;
const project=process.env.VERCEL_PROJECT_ID||'prj_h89MCmxn3Mr3O0wRpnwstM917E0l';
const sha=process.env.RELEASE_SHA;
const domain='www.ordinarybrief.com';
if(!token)throw Error('VERCEL_TOKEN secret missing. Configure it in GitHub Actions; release NOT promoted.');
if(!/^[0-9a-f]{40}$/.test(sha||''))throw Error('Expected exact 40-character RELEASE_SHA');
const api='https://api.vercel.com';
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(path,options={}){
 const r=await fetch(api+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(20000)});
 const body=await r.text();let data;try{data=JSON.parse(body)}catch{data={message:body.slice(0,300)}}
 if(!r.ok)throw Error(`Vercel API ${r.status}: ${JSON.stringify(data).slice(0,500)}`);
 return data;
}
async function findBuild(){
 const q=new URLSearchParams({projectId:project,target:'production',limit:'20'});
 const result=await request('/v6/deployments?'+q);
 const items=result.deployments||[];
 return items.find(x=>x.meta?.githubCommitSha===sha&&x.meta?.githubCommitRef==='main');
}
let build;
for(let i=0;i<40;i++){
 build=await findBuild();
 if(build?.state==='ERROR'||build?.state==='CANCELED')throw Error('Vercel build failed for '+sha);
 if(build?.state==='READY')break;
 console.log('Waiting for exact Vercel build',sha.slice(0,8),build?.state||'not found');
 await sleep(15000);
}
if(build?.state!=='READY')throw Error('Matching production build never became READY; release NOT promoted');
console.log('READY build',build.uid||build.id,'commit',sha);
const id=build.uid||build.id;
const promoted=await request(`/v10/projects/${encodeURIComponent(project)}/promote/${encodeURIComponent(id)}`,{method:'POST',body:'{}'});
console.log('Promotion requested',JSON.stringify(promoted).slice(0,300));
let verified=false;
for(let i=0;i<24;i++){
 const r=await request('/v13/deployments/'+encodeURIComponent(domain));
 if((r.id||r.uid)===id&&r.meta?.githubCommitSha===sha&&r.readyState==='READY'){verified=true;break}
 console.log('Waiting for domain assignment',i+1);
 await sleep(10000);
}
if(!verified)throw Error('Live domain does not resolve to expected deployment SHA; release NOT verified');
console.log('VERIFIED production domain',domain,'commit',sha,'deployment',id);
