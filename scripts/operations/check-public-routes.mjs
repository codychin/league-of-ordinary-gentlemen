#!/usr/bin/env node
// Production smoke test. Every expected public article must return HTTP 200 and render actual content.
import assert from 'node:assert/strict';
import {validatePublicPage} from './public-route-validation.mjs';
const origin=(process.env.BASE_URL||'https://www.ordinarybrief.com').replace(/\/$/,'');
const slug=process.env.ARTICLE_SLUG||'hollis-mike-ditka-juice-box-guy';
const expectedTitle=process.env.EXPECTED_TITLE||'The Juice Box Guy';
assert.equal(new URL(origin).protocol,'https:');
const parsed=new URL(origin);
assert.equal(parsed.origin,origin,'Expected an HTTPS origin without credentials or a path');
if(process.env.VERCEL_AUTOMATION_BYPASS_SECRET)assert.ok(parsed.hostname.endsWith('.vercel.app'),'Bypass credentials require a verified Vercel deployment origin');
assert.match(slug,/^[a-z0-9-]+$/);
const paths=['/','/sunday-crew','/doge',...['','/sunday-crew','/doge'].map(prefix=>prefix+'/articles/'+slug)];
let errors=0;
for(const path of paths){
 try{
  const res=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache','User-Agent':'TheBrief-ProductionSmoke/1.0',...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET?{'x-vercel-protection-bypass':process.env.VERCEL_AUTOMATION_BYPASS_SECRET}:{})}});
  const body=await res.text();
  const article=path.includes('/articles/');
  validatePublicPage(res.status,body,{article,expectedTitle:article?expectedTitle:undefined});
  const ok=true;
  console.log(ok?'PASS':'FAIL',res.status,path,'title:',article?body.includes(expectedTitle):'n/a');
  if(!ok)errors++;
 }catch(e){console.error('FAIL',path,e.message);errors++}
}
// Feature-specific smoke check: a deployment's HTTP 200 alone cannot validate the changed media.
const featurePath=process.env.FEATURE_ARTICLE_PATH;
const featureImage=process.env.FEATURE_IMAGE_PATH;
if(featurePath||featureImage){
 assert.ok(featurePath&&featureImage,'Both FEATURE_ARTICLE_PATH and FEATURE_IMAGE_PATH are required');
 assert.match(featurePath,/^\/articles\/[a-z0-9-]+$/);
 assert.match(featureImage,/^\/images\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp)$/i);
 const page=await fetch(origin+featurePath,{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
 const html=await page.text();
 assert.equal(page.status,200,'Feature article not live');
 assert.ok(html.includes(featureImage),'Feature article does not reference expected image');
 const asset=await fetch(origin+featureImage,{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
 const bytes=await asset.arrayBuffer();
 assert.equal(asset.status,200,'Featured image failed');
 assert.match(asset.headers.get('content-type')||'',/^image\//i,'Featured asset is not an image');
 assert.ok(bytes.byteLength>4096,'Featured image appears truncated or empty');
 console.log('PASS featured image',featurePath,featureImage,bytes.byteLength,'bytes');
}
if(errors)throw Error(errors+' public routes failed. DO NOT MARK RELEASE VERIFIED.');
