#!/usr/bin/env node
// Production smoke test. Every expected public article must return HTTP 200 and render actual content.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkEditorialRelease} from './check-editorial-release.mjs';
import {validatePublicPage} from './public-route-validation.mjs';
const origin=(process.env.BASE_URL||'https://www.ordinarybrief.com').replace(/\/$/,'');
const slug=process.env.ARTICLE_SLUG;
const expectedTitle=process.env.EXPECTED_TITLE;
const releaseHeaders={'Cache-Control':'no-cache',...(process.env.VERCEL_TRUSTED_OIDC_TOKEN?{'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_TRUSTED_OIDC_TOKEN}:{})};
assert.equal(new URL(origin).protocol,'https:');
const parsed=new URL(origin);
assert.equal(parsed.origin,origin,'Expected an HTTPS origin without credentials or a path');
if(process.env.VERCEL_TRUSTED_OIDC_TOKEN)assert.ok(parsed.hostname.endsWith('.vercel.app'),'Identity credentials require a verified Vercel deployment origin');
if(slug)assert.match(slug,/^[a-z0-9-]+$/);
if(expectedTitle)assert.ok(slug,'EXPECTED_TITLE requires ARTICLE_SLUG');
const paths=['/','/sunday-crew','/doge',...(slug?['','/sunday-crew','/doge'].map(prefix=>prefix+'/articles/'+slug):[])];
let errors=0;
for(const path of paths){
 try{
  const res=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache','User-Agent':'TheBrief-ProductionSmoke/1.0',...(process.env.VERCEL_TRUSTED_OIDC_TOKEN?{'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_TRUSTED_OIDC_TOKEN}:{})}});
  const body=await res.text();
  const article=path.includes('/articles/');
  validatePublicPage(res.status,body,{article,expectedTitle:article&&slug&&path.endsWith('/'+slug)?expectedTitle:undefined});
  if(!article){
   const root=path==='/'?'':path;
   const lead=body.match(/<section[^>]*aria-label="Lead story: [^"]+"[^>]*>([\s\S]*?)<\/section>/)?.[1];
   assert.ok(lead,'Lead story missing');
   const link=lead.match(/href="([^"]+)"/)?.[1];
   assert.ok(link?.startsWith(root+'/articles/'),'Lead must link to its edition');
   assert.match(link,new RegExp('^'+root+'/articles/[a-z0-9-]+$'));
   if(!paths.includes(link))paths.push(link);
   const row=body.match(/aria-label="Recent stories"[\s\S]*?<\/section>/)?.[0];
   assert.ok(row,'Recent stories missing');
   assert.equal([...row.matchAll(/<h3\b/g)].length,3,'Expected three recent story cards');
  }
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
// Historical publication expectations are opt-in, not universal site health.
if(process.env.EDITORIAL_RELEASE_MANIFEST){
 const manifest=JSON.parse(readFileSync(process.env.EDITORIAL_RELEASE_MANIFEST,'utf8'));
 await checkEditorialRelease({origin,manifest,headers:releaseHeaders});
}

if(process.env.RELEASE_CANARY_FAIL==='1')throw Error('Intentional staging failure canary; release MUST NOT be promoted');
if(errors)throw Error(errors+' public routes failed. DO NOT MARK RELEASE VERIFIED.');
