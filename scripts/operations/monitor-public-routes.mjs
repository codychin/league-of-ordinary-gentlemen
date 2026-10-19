#!/usr/bin/env node
// Checks the actual production HTML of all three editions and every globally linked homepage story.
import {readFileSync,writeFileSync} from 'node:fs';
const root=(process.env.BASE_URL||'https://www.ordinarybrief.com').replace(/\/$/,'');
const u=new URL(root);
if(u.protocol!=='https:'||u.pathname!=='/'||u.username||u.password)throw Error('Expected an HTTPS origin');
const front=readFileSync('app/components/SharedEditorialFront.js','utf8');
const slugs=[...new Set([...front.matchAll(/root\+"\/articles\/([a-z0-9-]+)"/g)].map(m=>m[1]))];
if(slugs.length<8)throw Error('Refusing an empty or truncated editorial manifest');
const prefixes=['','/sunday-crew','/doge'];
const targets=[...prefixes.map(x=>x||'/'),...prefixes.flatMap(x=>slugs.map(slug=>x+'/articles/'+slug))];
const failures=[],passed=[];
async function check(path){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const res=await fetch(root+path,{redirect:'follow',signal:AbortSignal.timeout(15000),headers:{'Cache-Control':'no-cache','User-Agent':'OrdinaryBrief-LiveSentinel/1.0'}});
   const html=await res.text();
   if(res.status!==200)throw Error('HTTP '+res.status);
   if(!html.includes('The Brief'))throw Error('Expected publication marker missing');
   if(/Story not found\.|Sorry, not found|404: This page|This deployment is protected/i.test(html))throw Error('Missing-page content');
   if(path.includes('/articles/')&&!html.includes('<h1'))throw Error('Article headline missing');
   passed.push(path);
   return;
  }catch(e){last=e.message;if(attempt===0)await new Promise(r=>setTimeout(r,2000))}
 }
 failures.push({path,error:last});
}
let cursor=0;
await Promise.all(Array.from({length:5},async()=>{while(cursor<targets.length){const i=cursor++;await check(targets[i])}}));
const report={origin:root,checkedAt:new Date().toISOString(),count:targets.length,passed:passed.length,failures};
const out=process.env.REPORT_PATH||'/tmp/brief-route-report.json';
writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(failures.length)process.exitCode=1;
