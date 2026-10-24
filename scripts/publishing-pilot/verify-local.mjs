// Bounded operator-triggered verifier for the disposable LOCAL pilot only.
// Not an unattended/hosted runner and not authentication proof.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {call,sql,quote,ACTORS,RENDERER} from './local-db.mjs';
import {sessionCookie} from './local-gateway.mjs';
const requestId=process.argv[2];assert.match(requestId||'',/^[0-9a-f-]{36}$/);
const activation=JSON.parse(await sql(`select row_to_json(a) from brief_pilot.activations a where request_id=${quote(requestId)}::uuid;`));
assert.ok(activation);const cookie=sessionCookie(ACTORS.verifier),routes=[];
const expected=JSON.parse(readFileSync('tests/fixtures/publishing-pilot/expected.json'));
for(const edition of ['loog','sunday-crew','doge'])for(const path of ['', '/articles/'+expected.home[0]]){
 const route='/publishing-pilot/'+edition+path;routes.push(route);
 const response=await fetch('http://127.0.0.1:4320'+route,{headers:{Cookie:cookie.name+'='+cookie.value},signal:AbortSignal.timeout(10000)});
 assert.equal(response.status,200);const html=await response.text();
 assert.ok(html.includes('data-pilot-release="'+activation.digest+'"'));assert.ok(html.includes('data-pilot-renderer="'+RENDERER+'"'));
 assert.ok(!html.includes('Staging pilot unavailable'));if(path)assert.ok(html.includes(expected.lastParagraph));
}
console.log(await call('verify',{digest:activation.digest,requestId,evidence:{passed:true,digest:activation.digest,routes,kind:'operator-triggered-local-http-verification'}},ACTORS.verifier));
