import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyRoutes} from '../scripts/publishing-pilot/verify-routes.mjs';
const fixture={activation:{digest:'approved-digest',request_id:'request'},renderer:'fixed-renderer',expected:{home:['jay-z'],lastParagraph:'Independent expected final paragraph.'}};
const html='<main data-pilot-release="approved-digest" data-pilot-renderer="fixed-renderer">Independent expected final paragraph.</main>';
test('technical verifier attests only after six independently checked routes',async()=>{
 const seen=[];let attestations=0;
 await verifyRoutes({...fixture,read:async route=>{seen.push(route);return new Response(html,{headers:{'cache-control':'private, no-store'}});},attest:async args=>{attestations++;assert.equal(seen.length,6);assert.deepEqual(args.evidence.routes,seen);}});
 assert.equal(attestations,1);
});
for(const failure of ['stale','renderer','body','cache','offline','unavailable','timeout','redirect'])test('verifier refuses '+failure+' without writing any attestation',async()=>{
 let writes=0,count=0;
 await assert.rejects(verifyRoutes({...fixture,read:async()=>{
  if(++count!==6)return new Response(html,{headers:{'cache-control':'private, no-store'}});
  if(failure==='timeout')throw Error('timeout');
  let body=html;
  if(failure==='stale')body=body.replace('approved-digest','old');
  if(failure==='renderer')body=body.replace('fixed-renderer','other');
  if(failure==='body')body=body.replace(fixture.expected.lastParagraph,'different copy');
  if(failure==='offline')body+='data-pilot-offline';
  if(failure==='unavailable')body+='Staging pilot unavailable';
  const r=new Response(body,{headers:{'cache-control':failure==='cache'?'public, max-age=60':'private, no-store'}});
  if(failure==='redirect')Object.defineProperty(r,'redirected',{value:true});
  return r;
 },attest:async()=>{writes++;}}));assert.equal(writes,0);
});
