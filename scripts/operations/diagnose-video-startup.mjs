import fs from 'node:fs';import path from 'node:path';
const base=new URL(process.env.BASE_URL||'http://127.0.0.1:3000');
if(!['127.0.0.1','localhost'].includes(base.hostname)||base.protocol!=='http:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error('Local diagnostic origin required');
const output='qa/reports/video-startup-diagnostic.json';
const rows=JSON.parse(fs.readFileSync('data/week9-approved-homepage-media.json'));
const {webkit}=await import('playwright');const browser=await webkit.launch({headless:true});
const results=[];let deadline;
const snapshot=async page=>page.evaluate(()=>({events:window.__mediaEvents||[],videos:[...document.querySelectorAll('video')].map(v=>({id:v.dataset.diagnosticId||null,hidden:v.getAttribute('aria-hidden'),src:v.currentSrc,paused:v.paused,muted:v.muted,readyState:v.readyState,networkState:v.networkState,currentTime:v.currentTime,duration:v.duration,error:v.error?{code:v.error.code,message:v.error.message}:null,buffered:Array.from({length:v.buffered.length},(_,i)=>[v.buffered.start(i),v.buffered.end(i)]),frames:v.getVideoPlaybackQuality?{...(()=>{const q=v.getVideoPlaybackQuality();return {total:q.totalVideoFrames,dropped:q.droppedVideoFrames};})()}:null,decodedFrames:v.webkitDecodedFrameCount??null}))}));
async function instrument(context){await context.addInitScript(()=>{
 window.__mediaEvents=[];
 const record=(v,event,extra={})=>window.__mediaEvents.push({at:performance.now(),id:v.dataset.diagnosticId||null,hidden:v.getAttribute('aria-hidden'),src:v.currentSrc||v.src,event,time:v.currentTime,paused:v.paused,muted:v.muted,ready:v.readyState,...extra});
 for(const event of ['loadstart','loadedmetadata','loadeddata','canplay','canplaythrough','play','playing','pause','waiting','stalled','suspend','error','emptied','volumechange','ended'])document.addEventListener(event,e=>{if(e.target instanceof HTMLMediaElement)record(e.target,event);},true);
 const original=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(...args){record(this,'play-called');let p;try{p=original.apply(this,args);}catch(e){record(this,'play-threw',{error:e.name});throw e;}p?.then(()=>record(this,'play-resolved'),e=>record(this,'play-rejected',{error:e.name}));return p;};
});}
async function runCase(spec){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await instrument(context);
 const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);
 const result={...spec,console:[]};page.on('console',m=>result.console.push({type:m.type(),text:m.text()}));page.on('pageerror',e=>result.console.push({type:'pageerror',text:e.message}));
 try{
  const cohort=rows.filter(r=>r.edition===spec.edition);
  if(spec.mode==='baseline'){
   await page.goto(base.origin+(spec.edition==='loog'?'/':'/sunday-crew'));
   await page.getByRole('region',{name:'Week 9, the previews. videos'}).getByRole('button',{name:/^Watch /}).first().click();
  }else{
   // Fulfill only this inert fixture route; every MP4 request goes to real Next.
   await page.route('**/__video_startup_fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width"><button id="start">Start diagnostic</button><div id="stage"></div>'}));
   await page.goto(base.origin+'/__video_startup_fixture');
   await page.evaluate(({active,next,preload,muted})=>{
    document.querySelector('#start').onclick=()=>{
     const stage=document.querySelector('#stage');
     if(preload){const hidden=document.createElement('video');hidden.dataset.diagnosticId='hidden';hidden.setAttribute('aria-hidden','true');hidden.preload='auto';hidden.muted=true;hidden.playsInline=true;hidden.style.cssText='position:absolute;width:300px;opacity:.001;pointer-events:none;z-index:0';hidden.src='/reels/'+next+'.mp4?v=15';stage.append(hidden);}
     const v=document.createElement('video');v.dataset.diagnosticId='active';v.preload='auto';v.muted=muted;v.playsInline=true;v.autoplay=true;v.style.cssText='position:relative;width:300px;z-index:1';v.src='/reels/'+active+'.mp4?v=15';stage.append(v);v.play().catch(()=>{});
    };
   },{active:cohort[0].id,next:cohort[1].id,preload:spec.preload,muted:spec.muted});
   await page.locator('#start').click();
  }
  await page.waitForTimeout(3000);result.initial=await snapshot(page);
  const active=result.initial.videos.find(v=>v.hidden!=='true');result.stalled=!active||active.currentTime<=.2;
  if(result.stalled){
   // Explicit user gesture A/B recovery, not a change to release assertions.
   await page.evaluate(()=>{const b=document.createElement('button');b.id='diagnostic-mute-play';b.textContent='Mute and play';b.style.cssText='position:fixed;top:0;left:0;z-index:2147483647';b.onclick=()=>{const v=[...document.querySelectorAll('video')].find(v=>v.getAttribute('aria-hidden')!=='true');if(v){v.muted=true;v.play().catch(()=>{});}};document.body.append(b);});
   await page.locator('#diagnostic-mute-play').click();await page.waitForTimeout(3000);result.afterUserMutePlay=await snapshot(page);
  }
 }catch(e){result.error=e.message;result.final=await snapshot(page).catch(()=>null);}
 finally{results.push(result);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({version:1,origin:base.origin,diagnosticOnly:true,results},null,2));await context.close();}
}
try{await Promise.race([(async()=>{
 for(const edition of ['loog','sunday-crew'])for(let repetition=1;repetition<=3;repetition++)await runCase({edition,mode:'baseline',repetition});
 for(const edition of ['loog','sunday-crew'])for(const preload of [false,true])for(const muted of [false,true])for(let repetition=1;repetition<=2;repetition++)await runCase({edition,mode:'fixture',preload,muted,repetition});
})(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('DIAGNOSTIC_DEADLINE_180_SECONDS')),180000);})]);}
finally{clearTimeout(deadline);await browser.close();}
console.log(JSON.stringify({diagnosticOnly:true,cases:results.length,stalled:results.filter(r=>r.stalled).length,errors:results.filter(r=>r.error).length,output}));
