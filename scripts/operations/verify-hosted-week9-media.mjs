import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {selectWeek10RecapCohort} from '../../lib/week10-recap-cohort.mjs';
import {selectWeek10PreviewCohort} from '../../lib/week10-preview-cohort.mjs';
import {selectWeek9PreviewCohort} from '../../lib/week9-preview-cohort.mjs';
import {verifiedOrigin,scopedHeaders,assertNoRedirect} from './hosted-media-scope.mjs';
export {AUTH_HEADER,verifiedOrigin,scopedHeaders,assertNoRedirect} from './hosted-media-scope.mjs';
const need=(ok,code)=>{if(!ok)throw Error(code);};
const diagnosticCodes=new Set(['CLOSE_SCROLL_POSITION_CHANGED', 'DOCUMENT_SCROLL_STILL_LOCKED', 'HEADER_CHANGED_AFTER_CLOSE', 'HISTORICAL_WATCH_COUNT_MISMATCH', 'HISTORICAL_WATCH_ID_MISMATCH', 'HLS_INIT_INVALID', 'HLS_NOT_COMPLETE', 'HLS_SEGMENT_PATH_INVALID', 'HOME_COHORT_MISMATCH', 'HOME_HTTP_FAILED', 'HOSTED_VERIFY_TIMEOUT', 'INCOMPLETE_HOSTED_RECEIPT', 'INVALID_RELEASE_SHA', 'MEDIA_HTTP_FAILED', 'MEDIA_ORIGIN_MISMATCH', 'METADATA_MISMATCH', 'PLAYER_ID_MISMATCH', 'SCOPED_REQUEST_FAILED', 'UNMUTED_PLAYBACK_REQUIRED', 'WATCH_COUNT_MISMATCH', 'WATCH_HTTP_FAILED', 'WATCH_ID_MISMATCH', 'WEEK10_COHORT_INVALID', 'WEEK9_COHORT_INVALID']);
export const safeDiagnosticCode=error=>diagnosticCodes.has(error?.message)?error.message:(error?.name==='TimeoutError'?'BROWSER_TIMEOUT':'VERIFICATION_ERROR');
let diagnostic={stage:'initializing',browser:null,edition:null};
const stage=value=>{diagnostic.stage=value;};
export function validatedRows(manifest,authority){
 const rows=['loog','doge','sunday-crew'].flatMap(e=>selectWeek9PreviewCohort(manifest,e,authority));
 need(rows.length===18,'WEEK9_COHORT_INVALID');return rows;
}
export function activeRelease({week9Manifest,week9Authority,week10Manifest,week10Authority,week10RecapManifest,week10RecapAuthority}){
 const historicalRows=validatedRows(week9Manifest,week9Authority);
 if(week10Manifest!==undefined || week10Authority!==undefined){
  const rows=['loog','doge','sunday-crew'].flatMap(e=>selectWeek10PreviewCohort(week10Manifest,e,week10Authority));
  need(rows.length===18,'WEEK10_COHORT_INVALID');
  if(week10RecapManifest!==undefined || week10RecapAuthority!==undefined){
   const recaps=['loog','doge','sunday-crew'].flatMap(e=>selectWeek10RecapCohort(week10RecapManifest,e,week10RecapAuthority));
   need(recaps.length===18,'WEEK10_COHORT_INVALID');return {week:10,kind:'recap',rows:recaps,historicalRows,priorPreviewRows:rows};
  }
  return {week:10,kind:'preview',rows,historicalRows,priorPreviewRows:[]};
 }
 need(week10RecapManifest===undefined&&week10RecapAuthority===undefined,'WEEK10_COHORT_INVALID');
 return {week:9,kind:'preview',rows:historicalRows,historicalRows,priorPreviewRows:[]};
}
export async function verifyHostedWeek9Media(env=process.env){
 // A failed rerun must never leave a prior success receipt behind.
 fs.rmSync('hosted-media-receipt.json',{force:true});
 const origin=verifiedOrigin(env.BASE_URL,env.VERIFIED_CANDIDATE_ORIGIN);
 need(/^[a-f0-9]{40}$/.test(env.RELEASE_SHA||''),'INVALID_RELEASE_SHA');
 const token=env.VERCEL_TRUSTED_OIDC_TOKEN;scopedHeaders(origin,origin,{},token);
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const optional=p=>fs.existsSync(p)?read(p):undefined;
 const {week,kind,rows,historicalRows,priorPreviewRows}=activeRelease({week9Manifest:read('data/week9-approved-homepage-media.json'),week9Authority:read('qa/week9-owner-playback-waiver.json'),week10Manifest:optional('data/week10-approved-homepage-media.json'),week10Authority:optional('qa/week10-publication-authority.json'),week10RecapManifest:optional('data/week10-recap-approved-homepage-media.json'),week10RecapAuthority:optional('qa/week10-recap-owner-playback-waiver.json')});
 const {chromium,webkit}=await import('playwright');
 const receipt={version:2,week,historicalWeek:9,releaseSha:env.RELEASE_SHA,origin,checkedAt:new Date().toISOString(),browsers:[],media:[]};
 for(const [name,engine] of Object.entries({chromium,webkit})){
  diagnostic.browser=name;stage('browser-launch');
  const browser=await engine.launch({headless:true});
  let timer;
  try{
   await Promise.race([(async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    let routeFailure=false;
    await context.route('**/*',async route=>{
     const request=route.request();const headers=scopedHeaders(request.url(),origin,request.headers(),token);
     try{
      if(new URL(request.url()).origin!==origin){await route.continue({headers});return;}
      // Header overrides on continue may survive redirects. Fetch once without
      // redirects, then fulfill, so no authenticated request can escape origin.
      const response=await route.fetch({headers,maxRedirects:0,timeout:30000});
      assertNoRedirect(response.status());await route.fulfill({response});
     }catch{routeFailure=true;await route.abort().catch(()=>{});}
    });
    const page=await context.newPage();page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(45000);
    for(const edition of ['loog','sunday-crew','doge']){
     diagnostic.edition=edition;stage('homepage');
     const prefix=edition==='loog'?'':'/'+edition;const cohort=rows.filter(r=>r.edition===edition);
     const response=await page.goto(origin+(prefix||'/'));need(response?.status()===200,'HOME_HTTP_FAILED');
     const shelf=page.getByRole('region',{name:`Week ${week}, the ${kind}s. videos`});
     stage('shelf-visible');await shelf.waitFor({state:'visible'});
     const buttons=shelf.getByRole('button',{name:/^Watch /});
     const ids=await buttons.evaluateAll(es=>es.map(e=>e.getAttribute('aria-describedby')));
     need(JSON.stringify(ids)===JSON.stringify(cohort.map(r=>`reel-state-${edition}-week${week}-${kind}-v1-${r.id}`)),'HOME_COHORT_MISMATCH');
     await buttons.first().scrollIntoViewIfNeeded();
     const headerBefore=await page.locator('header').first().innerText();
     await buttons.first().evaluate(e=>e.addEventListener('click',()=>{window.__hostedReelClickTop=e.getBoundingClientRect().top},{capture:true,once:true}));
     stage('foreground-playback');await buttons.first().click();const anchorBefore=await page.evaluate(()=>window.__hostedReelClickTop);const player=page.getByRole('dialog').locator('video:not([aria-hidden="true"])');
     await player.waitFor({state:'visible'});
     await player.evaluate(v=>new Promise((resolve,reject)=>{
      const started=Date.now();const interval=setInterval(()=>{
       if(v.currentTime>.2){clearInterval(interval);resolve();}
       else if(Date.now()-started>20000){clearInterval(interval);reject(Error('PLAYBACK_STALLED'));}
      },100);
     }));
     need((await player.evaluate(v=>v.currentSrc)).includes(cohort[0].id),'PLAYER_ID_MISMATCH');
     need(await player.evaluate(v=>!v.muted&&v.volume>0),'UNMUTED_PLAYBACK_REQUIRED');
     stage('close-player');await page.getByRole('button',{name:'Close video',exact:true}).click();
     need(Math.abs((await buttons.first().evaluate(e=>e.getBoundingClientRect().top))-anchorBefore)<3,'CLOSE_SCROLL_POSITION_CHANGED');
     need(await page.evaluate(()=>document.documentElement.style.overflow!=='hidden'&&document.body.style.overflow!=='hidden'),'DOCUMENT_SCROLL_STILL_LOCKED');
     need(await page.locator('header').first().innerText()===headerBefore,'HEADER_CHANGED_AFTER_CLOSE');
     stage('original-metadata');for(const row of cohort){
      const observed=await page.evaluate(({id})=>new Promise((resolve,reject)=>{
       const v=document.createElement('video');v.preload='metadata';v.muted=true;v.playsInline=true;
       const done=()=>{clearTimeout(timer);v.onloadedmetadata=null;v.onerror=null;v.removeAttribute('src');v.load();v.remove();};
       const timer=setTimeout(()=>{done();reject(Error('METADATA_TIMEOUT'));},15000);
       v.onloadedmetadata=()=>{const result={duration:v.duration,width:v.videoWidth,height:v.videoHeight};done();resolve(result);};
       v.onerror=()=>{done();reject(Error('METADATA_DECODE_ERROR'));};
       document.body.append(v);v.src='/reels/'+id+'.mp4';
      }),{id:row.id});
      need(Math.abs(observed.duration-row.durationSeconds)<.2&&observed.width>0&&observed.height>observed.width,'METADATA_MISMATCH');
     }
     stage('current-watch-archive');const archive=await page.goto(origin+prefix+'/archive/watch');need(archive?.status()===200,'WATCH_HTTP_FAILED');
     const games=page.locator('section[aria-labelledby="games-heading"]');
     await games.getByRole('status').filter({hasText:`Week ${week} · ${kind==='recap'?12:6} videos`}).waitFor();
     if(kind==='recap'){
      need(await games.getByRole('button',{name:/^Watch /}).count()===12,'WATCH_COUNT_MISMATCH');
      for(const row of priorPreviewRows.filter(r=>r.edition===edition))need(await games.locator(`img[src*="${row.id}"]`).count()===1,'HISTORICAL_WATCH_ID_MISMATCH');
      await page.getByLabel('Coverage',{exact:false}).selectOption('recap');
     }
     need(await games.getByRole('button',{name:/^Watch /}).count()===6,'WATCH_COUNT_MISMATCH');
     for(const row of cohort)need(await games.locator(`img[src*="${row.id}"]`).count()===1,'WATCH_ID_MISMATCH');
     if(week!==9){
      stage('historical-watch-archive');
      await page.getByLabel('Coverage',{exact:false}).selectOption('');
      await games.getByRole('combobox',{name:/^Week/}).selectOption('9');
      await games.getByRole('status').filter({hasText:'Week 9 · 6 videos'}).waitFor();
      need(await games.getByRole('button',{name:/^Watch /}).count()===6,'HISTORICAL_WATCH_COUNT_MISMATCH');
      for(const row of historicalRows.filter(r=>r.edition===edition))need(await games.locator(`img[src*="${row.id}"]`).count()===1,'HISTORICAL_WATCH_ID_MISMATCH');
     }
    }
    stage('hls-assets');if(name==='chromium')for(const row of rows){
     const base=origin+'/reels-hls/'+row.id+'/';
     const get=async(url,method='GET')=>{need(new URL(url).origin===origin,'MEDIA_ORIGIN_MISMATCH');const r=await context.request.fetch(url,{method,headers:scopedHeaders(url,origin,{},token),maxRedirects:0,timeout:20000});assertNoRedirect(r.status());need(r.status()===200,'MEDIA_HTTP_FAILED');return r;};
     const playlist=await(await get(base+'index.m3u8')).text();need(playlist.includes('#EXT-X-ENDLIST'),'HLS_NOT_COMPLETE');
     const parts=playlist.split(/\r?\n/).filter(l=>l&&!l.startsWith('#'));
     need(parts.length>0&&parts.every(p=>/^seg_\d+\.m4s$/.test(p)),'HLS_SEGMENT_PATH_INVALID');
     need(playlist.includes('#EXT-X-MAP:URI="init.mp4"'),'HLS_INIT_INVALID');
     for(const p of ['poster.jpg','init.mp4',...parts])await get(base+p,'HEAD');
     receipt.media.push({videoId:row.id,manifest:true,poster:true,init:true,segments:parts.length});
    }
    need(!routeFailure,'SCOPED_REQUEST_FAILED');receipt.browsers.push({name,editions:3,shelfVideos:18,decodedOriginals:18,foregroundPlayback:3});await context.close();
   })(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('HOSTED_VERIFY_TIMEOUT')),110000);})]);
  }finally{clearTimeout(timer);await browser.close();}
 }
 need(receipt.browsers.length===2&&receipt.media.length===18,'INCOMPLETE_HOSTED_RECEIPT');
 const output='hosted-media-receipt.json';fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{await verifyHostedWeek9Media();console.log('Hosted current-week verification passed: both browsers, three editions, eighteen originals.');}
 catch(error){const code=safeDiagnosticCode(error);console.error('HOSTED_MEDIA_FAILURE '+JSON.stringify({...diagnostic,code}));process.exitCode=1;}
}
