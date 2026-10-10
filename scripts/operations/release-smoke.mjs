#!/usr/bin/env node
// Independent public-URL release verification. Fail closed on any missing assertion.
// BASE_URL, EXPECTED_SHA and (optionally) ARTICLE_SLUG are required for release approval.
import assert from 'node:assert/strict';
const raw=process.env.BASE_URL,expected=process.env.EXPECTED_SHA;
if(!raw||!expected||!/^[a-f0-9]{7,40}$/i.test(expected))throw Error('BASE_URL and a valid EXPECTED_SHA are required');
const root=new URL(raw);
if(root.protocol!=='https:'||root.username||root.password||root.pathname!=='/')throw Error('Expected a bare HTTPS origin');
if(process.env.RELEASE_MODE==='production'&&root.hostname!=='www.ordinarybrief.com')throw Error('Production mode must test the canonical public domain');
async function page(path){
 const u=new URL(path,root);
 const response=await fetch(u,{redirect:'follow',headers:{'Cache-Control':'no-cache','User-Agent':'Brief-Release-Sentinel/1.0'},signal:AbortSignal.timeout(25000)});
 assert.equal(response.status,200,`${path} returned ${response.status}`);
 assert.equal(response.url.startsWith(root.origin),true,`${path} redirected outside expected origin`);
 const text=await response.text();
 assert.doesNotMatch(text,/(Story not found\.|Sorry, not found|404: This page|This deployment is protected)/i,path);
 return text;
}
const health=await fetch(new URL('/api/release-health',root),{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(25000)});
assert.equal(health.status,200,'release health must return 200');
const meta=await health.json();
assert.equal(meta.status,'ok');
assert.ok(meta.commit.startsWith(expected),`Wrong release: expected ${expected}, got ${meta.commit}`);
console.log('PASS release identity',meta.commit);
for(const route of ['/','/sunday-crew','/doge']){
 const html=await page(route);
 assert.ok(html.includes('The Brief')||html.includes('ordinary'),`Unexpected home page body: ${route}`);
 console.log('PASS',route);
}
const slug=process.env.ARTICLE_SLUG;
if(slug){
 assert.match(slug,/^[a-z0-9-]+$/,'invalid article slug');
 for(const prefix of ['','/sunday-crew','/doge']){
  const path=`${prefix}/articles/${slug}`;
  const html=await page(path);
  if(process.env.EXPECTED_TITLE)assert.ok(html.includes(process.env.EXPECTED_TITLE),`Missing expected headline at ${path}`);
  console.log('PASS',path);
 }
 const front=await page('/');
 assert.ok(front.includes(`/articles/${slug}`),'Feature is missing from homepage');
 if(process.env.EXPECTED_VIDEO_ID)assert.ok((await page(`/articles/${slug}`)).includes(process.env.EXPECTED_VIDEO_ID),'Video iframe is missing');
}
console.log('PASS release smoke suite for',root.origin);
