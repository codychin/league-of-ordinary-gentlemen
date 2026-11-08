import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {AUTH_HEADER,verifiedOrigin,scopedHeaders,assertNoRedirect,validatedRows} from '../scripts/operations/verify-hosted-week9-media.mjs';
const origin='https://ordinary-brief-exact-candidate.vercel.app',token='fixture-not-a-real-token-value';
test('hosted verifier requires exact secure verified origin and rejects ambiguous URL input',()=>{
 assert.equal(verifiedOrigin(origin,origin+'/'),origin);
 for(const bad of ['http://ordinary-brief-exact-candidate.vercel.app','https://user:pass@ordinary-brief-exact-candidate.vercel.app',origin+'/foo',origin+'?token=x',origin+'#x',origin+':8443','https://evil.example','https://vercel.app.evil.example'])assert.throws(()=>verifiedOrigin(bad,origin));
 assert.throws(()=>verifiedOrigin(origin,'https://other.vercel.app'),/MISMATCH/);
});
test('OIDC header is origin scoped and stripped case-insensitively on every external request',()=>{
 assert.equal(scopedHeaders(origin+'/reels/a',origin,{},token)[AUTH_HEADER],token);
 for(const url of ['https://cdn.example/a','https://other.vercel.app/a','http://ordinary-brief-exact-candidate.vercel.app/a']){
  const h=scopedHeaders(url,origin,{'X-Vercel-Trusted-Oidc-Idp-Token':token,[AUTH_HEADER]:token,accept:'video/mp4'},token);
  assert.deepEqual(h,{accept:'video/mp4'});
 }
 assert.throws(()=>scopedHeaders(origin,origin,{},'bad\ntoken'),/INVALID/);
});
test('authenticated redirects fail closed instead of propagating credential headers',()=>{
 for(const code of [300,301,302,303,307,308])assert.throws(()=>assertNoRedirect(code),/REDIRECT/);
 assert.doesNotThrow(()=>assertNoRedirect(200));
 const src=fs.readFileSync('scripts/operations/verify-hosted-week9-media.mjs','utf8');
 assert.match(src,/route.fetch\(\{headers,maxRedirects:0/);assert.doesNotMatch(src,/extraHTTPHeaders|tracing\.start|screenshot\(/);
});
test('hosted verification never skips absent or incomplete Week9 release evidence',()=>{
 const rows=JSON.parse(fs.readFileSync('data/week9-approved-homepage-media.json'));const authority=JSON.parse(fs.readFileSync('qa/week9-owner-playback-waiver.json'));
 assert.equal(validatedRows(rows,authority).length,18);
 for(const bad of [undefined,[],rows.slice(1)])assert.throws(()=>validatedRows(bad,authority),/COHORT/);
});

test('trusted promotion keeps exact-main gates and requires scoped browser verification before promotion',async()=>{
 const {readFileSync}=await import('node:fs');
 const workflow=readFileSync('.github/workflows/promote-verified-production.yml','utf8');
 const promoter=readFileSync('scripts/operations/promote-verified-release.mjs','utf8');
 assert.match(workflow,/head_branch == 'main'/);assert.match(workflow,/workflow_run.event == 'push'/);
 assert.match(workflow,/environment: production/);assert.match(workflow,/id-token: write/);
 assert.match(workflow,/mcr\.microsoft\.com\/playwright:v1\.64\.1-noble@sha256:[a-f0-9]{64}/);
 assert.match(workflow,/npm ci --ignore-scripts/);assert.match(workflow,/hosted-media-receipt\.json/);
 assert.ok(promoter.indexOf("assert.equal(media.status,0")<promoter.indexOf("'/promote/'+id"));
 assert.ok(!workflow.includes('continue-on-error'));
});
