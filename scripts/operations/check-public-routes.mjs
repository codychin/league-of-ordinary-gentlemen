#!/usr/bin/env node
// Production smoke test. Every expected public article must return HTTP 200 and render actual content.
import assert from 'node:assert/strict';
const origin=(process.env.BASE_URL||'https://www.ordinarybrief.com').replace(/\/$/,'');
const slug=process.env.ARTICLE_SLUG||'hollis-mike-ditka-juice-box-guy';
const expectedTitle=process.env.EXPECTED_TITLE||'The Juice Box Guy';
assert.equal(new URL(origin).protocol,'https:');
assert.match(slug,/^[a-z0-9-]+$/);
const paths=['/','/sunday-crew','/doge',...['','/sunday-crew','/doge'].map(prefix=>prefix+'/articles/'+slug)];
let errors=0;
for(const path of paths){
 try{
  const res=await fetch(origin+path,{redirect:'follow',signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache','User-Agent':'TheBrief-ProductionSmoke/1.0'}});
  const body=await res.text();
  const article=path.includes('/articles/');
  const ok=res.status===200&&!/Sorry, not found|Story not found\.|404: This page|This deployment is protected/i.test(body)&&(!article||body.includes(expectedTitle));
  console.log(ok?'PASS':'FAIL',res.status,path,'title:',article?body.includes(expectedTitle):'n/a');
  if(!ok)errors++;
 }catch(e){console.error('FAIL',path,e.message);errors++}
}
if(errors)throw Error(errors+' public routes failed. DO NOT MARK RELEASE VERIFIED.');
