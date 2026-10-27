// Bounded operator-triggered verifier for the disposable LOCAL pilot only.
// Not an unattended/hosted runner and not authentication proof.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {call,sql,quote,ACTORS,RENDERER} from './local-db.mjs';
import {sessionCookie} from './local-gateway.mjs';
import {verifyRoutes} from './verify-routes.mjs';
const requestId=process.argv[2];assert.match(requestId||'',/^[0-9a-f-]{36}$/);
const activation=JSON.parse(await sql(`select row_to_json(a) from brief_pilot.activations a where request_id=${quote(requestId)}::uuid;`));
assert.ok(activation);const cookie=sessionCookie(ACTORS.verifier),routes=[];
const expected=JSON.parse(readFileSync('tests/fixtures/publishing-pilot/expected.json'));
console.log(await verifyRoutes({activation,renderer:RENDERER,expected,
 read:route=>fetch('http://127.0.0.1:4320'+route,{headers:{Cookie:cookie.name+'='+cookie.value},redirect:'error',signal:AbortSignal.timeout(10000)}),
 attest:args=>call('verify',args,ACTORS.verifier)}));
