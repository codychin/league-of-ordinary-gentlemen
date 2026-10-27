import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {sessionCookie} from './local-gateway.mjs';
import {call,sql,quote,ACTORS,RENDERER} from './local-db.mjs';
const {digests}=JSON.parse(readFileSync('/tmp/brief-pilot-db-results.json'));
const origin='http://127.0.0.1:4320',JAY='conrad-allow-me-to-reintroduce-myself',checks=[];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
async function context(){const c=await browser.newContext();await c.addCookies([sessionCookie()]);await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());return c;}
async function activate(digest){const h=await call('read',{edition:'loog'});await call('approve_publish',{digest,expectedGeneration:h.generation,requestId:randomUUID()});}
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
const preview=origin+'/publishing-pilot/loog?revision='+digests.correction;
try{
 await activate(digests.baseline);
 await check('pinned preview survives article/masthead/return while active release differs',async()=>{
  const c=await context(),p=await c.newPage();await p.goto(preview);
  await p.getByRole('link',{name:'READ CONRAD →',exact:true}).first().click();await p.waitForURL('**/articles/'+JAY+'?revision='+digests.correction);
  assert.equal(await p.locator('[data-pilot-release]').getAttribute('data-pilot-release'),digests.correction);assert.match(await p.locator('.articleDek').innerText(),/STAGING CORRECTION/);
  assert.equal(await p.locator('a.bylineWriter').count(),0);assert.equal(await p.locator('a[href*="/newsroom"]').count(),0);
  await p.locator('.miniMast').click();await p.waitForURL(preview);assert.equal(await p.locator('[data-pilot-release]').getAttribute('data-pilot-release'),digests.correction);
  await p.getByRole('link',{name:'READ CONRAD →',exact:true}).first().click();await p.locator('.back').click();await p.waitForURL(preview);
  assert.equal((await call('read',{edition:'loog'})).digest,digests.baseline);await c.close();
 });
 await check('lost response reconciles automatically; reload retains request; verification and supersession refresh',async()=>{
  const c=await context(),p=await c.newPage();let id,publishes=0;
  await p.route('**/api/publishing-pilot',async route=>{const input=route.request().postDataJSON();if(input.op==='approve_publish'){publishes++;id=input.args.requestId;await route.fetch();await route.abort('failed');}else await route.continue();});
  await p.goto(preview);await p.getByRole('button',{name:'Approve and publish',exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('[role=status]')?.dataset.committed==='true');
  assert.equal(await p.locator('[role=status]').getAttribute('data-request-id'),id);await p.reload();
  await p.waitForFunction(()=>document.querySelector('[role=status]')?.textContent==='Committed — awaiting verification');
  assert.equal(await p.locator('[role=status]').getAttribute('data-request-id'),id);assert.equal(publishes,1);
  await call('verify',{digest:digests.correction,requestId:id,evidence:{passed:true,digest:digests.correction,kind:'local-review-test'}},ACTORS.verifier);
  await p.waitForFunction(()=>document.querySelector('[role=status]')?.textContent==='verified-live');
  await activate(digests.baseline);await p.waitForFunction(()=>document.querySelector('[role=status]')?.textContent==='superseded');
  assert.equal(Number(await sql(`select count(*) from brief_pilot.activations where request_id=${quote(id)}::uuid;`)),1);await c.close();
 });
 await check('reload while publish response is interrupted recovers committed operation without second action',async()=>{
  const c=await context(),p=await c.newPage();let id,releaseResponse,committed=false,publishes=0;
  const held=new Promise(r=>releaseResponse=r);
  await p.route('**/api/publishing-pilot',async route=>{const input=route.request().postDataJSON();if(input.op==='approve_publish'){publishes++;id=input.args.requestId;const response=await route.fetch();committed=true;await held;try{await route.fulfill({response});}catch{}}else await route.continue();});
  await p.goto(preview);await p.getByRole('button',{name:'Approve and publish',exact:true}).click();
  for(let i=0;i<100&&!committed;i++)await new Promise(r=>setTimeout(r,50));assert.equal(committed,true);
  await p.reload();releaseResponse();await p.waitForFunction(()=>document.querySelector('[role=status]')?.dataset.committed==='true');
  assert.equal(await p.locator('[role=status]').getAttribute('data-request-id'),id);assert.equal(publishes,1);await c.close();await activate(digests.baseline);
 });
 await check('pre-send interruption reports recoverable failure and retries the same operation ID',async()=>{
  const c=await context(),p=await c.newPage();const ids=[];
  await p.route('**/api/publishing-pilot',async route=>{const input=route.request().postDataJSON();if(input.op==='approve_publish'){ids.push(input.args.requestId);if(ids.length===1){await route.abort('failed');return;}}await route.continue();});
  await p.goto(preview);await p.getByRole('button',{name:'Approve and publish',exact:true}).click();
  await p.getByRole('button',{name:'Retry same publication'}).waitFor();assert.equal(await p.getByRole('button',{name:'Approve and publish',exact:true}).isDisabled(),true);
  await p.reload();await p.getByRole('button',{name:'Retry same publication'}).click();await p.waitForFunction(()=>document.querySelector('[role=status]')?.dataset.committed==='true');
  assert.equal(ids.length,2);assert.equal(ids[0],ids[1]);await c.close();await activate(digests.baseline);
 });
 writeFileSync('/tmp/brief-pilot-review-browser.json',JSON.stringify({renderer:RENDERER,kind:'local-browser-real-postgres-synthetic-auth',checks,passed:checks.length},null,2));
}finally{await browser.close();}
