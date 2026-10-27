import assert from 'node:assert/strict';

// Caller supplies an independently expected fixture and authenticated transport.
// Never submit an attestation if any route is stale, redirected, offline or cached.
export async function verifyRoutes({activation,renderer,expected,read,attest}){
 const routes=[];
 for(const edition of ['loog','sunday-crew','doge'])for(const path of ['', '/articles/'+expected.home[0]]){
  const route='/publishing-pilot/'+edition+path;
  const response=await read(route);
  assert.equal(response.status,200);assert.equal(response.redirected,false);
  assert.match(response.headers.get('cache-control')||'',/no-store/);
  const html=await response.text();
  assert.ok(html.includes('data-pilot-release="'+activation.digest+'"'));
  assert.ok(html.includes('data-pilot-renderer="'+renderer+'"'));
  assert.ok(!/Staging pilot unavailable|data-pilot-offline/.test(html));
  if(path)assert.ok(html.includes(expected.lastParagraph));
  routes.push(route);
 }
 return attest({digest:activation.digest,requestId:activation.request_id,evidence:{passed:true,digest:activation.digest,routes,kind:'operator-triggered-http-verification'}});
}
