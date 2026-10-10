#!/usr/bin/env node
// One open incident for production route outages; updates and closes on recovery.
import {readFileSync} from 'node:fs';
const report=JSON.parse(readFileSync(process.env.REPORT_PATH||'/tmp/brief-route-report.json','utf8'));
const token=process.env.GITHUB_TOKEN,repo=process.env.GITHUB_REPOSITORY;
if(!token||!repo)throw Error('GITHUB_TOKEN and GITHUB_REPOSITORY required');
const api='https://api.github.com/repos/'+repo;
async function request(method,path,body){
 const res=await fetch(api+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 if(!res.ok)throw Error('GitHub alert operation failed '+res.status+': '+(await res.text()).slice(0,300));
 return res.status===204?null:res.json();
}
const title='[Production incident] The Brief public route monitor';
const issues=await request('GET','/issues?state=open&per_page=100');
const current=issues.find(x=>x.title===title&&!x.pull_request);
const details=report.failures.map(x=>'- '+x.path+' — '+x.error).join('\n');
const message='Checked '+report.count+' public routes across LOOG, Sunday Crew, DOGE at '+report.checkedAt+' UTC.\nPassed: '+report.passed+'. Failed: '+report.failures.length+'.\n\n'+details+'\n\nSee the failing GitHub Actions run. No automatic production changes were made.';
if(report.failures.length){
 if(current){await request('POST','/issues/'+current.number+'/comments',{body:'Still failing.\n\n'+message})}
 else await request('POST','/issues',{title,body:message,labels:['bug']}).catch(async e=>{if(String(e).includes('422'))await request('POST','/issues',{title,body:message});else throw e});
}else if(current){
 await request('POST','/issues/'+current.number+'/comments',{body:'Recovered: '+report.passed+'/'+report.count+' live routes passed at '+report.checkedAt+'.'});
 await request('PATCH','/issues/'+current.number,{state:'closed'});
}
