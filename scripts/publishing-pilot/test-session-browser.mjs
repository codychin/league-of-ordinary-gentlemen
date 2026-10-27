// Real SSR/Next cookie transport, synthetic local Auth only. No hosted credentials.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {tokenFor,sessionCookie} from './local-gateway.mjs';
const origin='http://127.0.0.1:4320',browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext(),page=await context.newPage();
 const post=(data,headers={Origin:origin})=>context.request.post(origin+'/api/publishing-pilot/session',{data,headers});
 assert.equal((await post({op:'bootstrap',access_token:tokenFor(),refresh_token:'local-test-only'},{Origin:'https://wrong.invalid'})).status(),403);
 assert.equal((await post({op:'bootstrap',access_token:tokenFor(undefined,1),refresh_token:'revoked'})).status(),401);
 assert.equal((await context.cookies()).length,0);
 let response=await post({op:'bootstrap',access_token:tokenFor(undefined,1),refresh_token:'local-test-only'});
 assert.equal(response.status(),200);assert.deepEqual(await response.json(),{authenticated:true});assert.match(response.headers()['cache-control'],/no-store/);
 assert.ok((await context.cookies()).some(c=>c.name.startsWith('sb-')));
 await page.goto(origin+'/publishing-pilot/loog');assert.equal(await page.locator('[data-pilot-release]').count(),1);
 // Force an expired local cookie; the actual Next proxy must refresh and persist it.
 const cookie=sessionCookie();const session=JSON.parse(Buffer.from(cookie.value.slice(7),'base64url').toString());
 session.access_token=tokenFor(undefined,1);session.expires_at=1;
 cookie.value='base64-'+Buffer.from(JSON.stringify(session)).toString('base64url');await context.addCookies([cookie]);
 await page.reload();assert.equal(await page.locator('[data-pilot-release]').count(),1);
 const renewed=(await context.cookies()).find(c=>c.name===cookie.name);assert.notEqual(renewed.value,cookie.value);
 response=await post({op:'refresh'});assert.equal(response.status(),200);
 console.log(JSON.stringify({kind:'local-synthetic-auth-not-hosted',passed:['wrong-origin','revoked-bootstrap-no-cookie','expired-bootstrap','page-read','proxy-refresh-cookie-persistence','explicit-refresh']}));
 await context.close();
}finally{await browser.close();}
