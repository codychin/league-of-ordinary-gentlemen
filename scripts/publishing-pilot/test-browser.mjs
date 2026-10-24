import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {sessionCookie} from './local-gateway.mjs';
import {call,ACTORS,RENDERER} from './local-db.mjs';
const origin='http://127.0.0.1:4320';
const result=JSON.parse(readFileSync('/tmp/brief-pilot-db-results.json'));
const expected=JSON.parse(readFileSync('tests/fixtures/publishing-pilot/expected.json'));
const baseline=JSON.parse(readFileSync('tests/fixtures/publishing-pilot/baseline.json'));
baseline.renderer=RENDERER;
const JAY=expected.home[0],digests=result.digests;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'allow'});
await context.addCookies([sessionCookie()]);
await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
const page=await context.newPage(),checks=[];let rscRequests=0;page.on('request',r=>{if(r.headers().rsc==='1')rscRequests++;});
const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name)};
try{
 await check('three-edition baseline, full overflow, title and metadata',async()=>{
  for(const e of ['loog','sunday-crew','doge']){
   const response=await page.goto(origin+'/publishing-pilot/'+e);assert.equal(response.status(),200);assert.match(response.headers()['cache-control'],/no-store/);
   assert.deepEqual(await page.locator('[data-story]').evaluateAll(nodes=>nodes.map(n=>n.dataset.story)),expected.home);
   assert.equal(await page.locator('[aria-label="Recent stories"] article').count(),3);
   await page.goto(origin+'/publishing-pilot/'+e+'/articles/'+JAY);
   assert.equal(await page.locator('h1.articleTitle').innerText(),expected.leadTitle);assert.equal(await page.title(),expected.leadTitle);
   assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),expected.leadDek);
   const body=await page.locator('.articleBody').innerText();assert.ok(body.includes(expected.lastParagraph));
   for(const paragraph of baseline.editions[e].articles[JAY].body.filter(x=>typeof x==='string'))assert.ok(body.includes(paragraph));
  }
 });
 await check('protected draft preview and unauthenticated access exclusion',async()=>{
  await page.goto(origin+'/publishing-pilot/loog/articles/'+JAY+'?revision='+digests.correction);
  assert.match(await page.locator('.articleDek').innerText(),/STAGING CORRECTION/);
  const anon=await browser.newContext();const p=await anon.newPage();await p.goto(origin+'/publishing-pilot/loog?revision='+digests.correction);
  assert.equal(await p.locator('[data-story]').count(),0);assert.match(await p.locator('h1').innerText(),/unavailable/);await anon.close();
 });
 await check('one publisher action commits correction without claiming verified-live',async()=>{
  await page.goto(origin+'/publishing-pilot/loog?revision='+digests.correction);
  await page.getByRole('button',{name:'Approve and publish',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[role=status]')?.dataset.committed==='true');
  await page.goto(origin+'/publishing-pilot/loog/articles/'+JAY);
  assert.match(await page.locator('.articleDek').innerText(),/STAGING CORRECTION/);assert.match(await page.locator('meta[name=description]').getAttribute('content'),/STAGING CORRECTION/);
  assert.equal(await page.locator('[data-pilot-renderer]').getAttribute('data-pilot-renderer'),RENDERER);
 });
 await check('rotation and rollback preserve the same fixed renderer',async()=>{
  let current=await call('read',{edition:'loog'});
  await call('approve_publish',{digest:digests.rotation,expectedGeneration:current.generation,requestId:randomUUID()});
  await page.goto(origin+'/publishing-pilot/loog');
  assert.deepEqual(await page.locator('[data-story]').evaluateAll(nodes=>nodes.map(n=>n.dataset.story)),['pilot-staging-lead',...expected.home]);
  current=await call('read',{edition:'loog'});await call('approve_publish',{digest:digests.baseline,expectedGeneration:current.generation,requestId:randomUUID()});
  await page.goto(origin+'/publishing-pilot/loog');assert.deepEqual(await page.locator('[data-story]').evaluateAll(nodes=>nodes.map(n=>n.dataset.story)),expected.home);
  assert.equal(await page.locator('[data-pilot-renderer]').getAttribute('data-pilot-renderer'),RENDERER);
 });
 await check('browser navigation uses complete active metadata/body',async()=>{
  await page.getByRole('link',{name:'READ CONRAD →',exact:true}).first().click();await page.waitForURL('**/articles/'+JAY);await page.waitForFunction(title=>document.title===title,expected.leadTitle);
  assert.equal(await page.title(),expected.leadTitle);assert.equal(await page.locator('.articleDek').innerText(),expected.leadDek);assert.ok(rscRequests>0,'browser navigation exercised RSC');
 });
 await check('service worker does not cache protected preview, including offline navigation',async()=>{
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;});
  await page.goto(origin+'/publishing-pilot/loog?revision='+digests.correction);
  const urls=await page.evaluate(async()=>{const urls=[];for(const key of await caches.keys())for(const req of await (await caches.open(key)).keys())urls.push(req.url);return urls;});
  assert.ok(!urls.some(u=>u.includes('/publishing-pilot')));
  await context.setOffline(true);await assert.rejects(page.goto(origin+'/publishing-pilot/loog?revision='+digests.correction));await context.setOffline(false);
 });
 mkdirSync('/tmp/brief-pilot-browser',{recursive:true});
 await page.goto(origin+'/publishing-pilot/loog');await page.screenshot({path:'/tmp/brief-pilot-browser/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/brief-pilot-browser/mobile.png',fullPage:true});
 writeFileSync('/tmp/brief-pilot-browser-results.json',JSON.stringify({kind:'local-next-browser-real-postgres-synthetic-auth',renderer:RENDERER,checks,passed:checks.length,rscRequests},null,2));
}finally{await browser.close();}
