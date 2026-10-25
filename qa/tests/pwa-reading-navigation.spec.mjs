import {test,expect} from '@playwright/test';

const readingPosition=element=>{
 const top=element.getBoundingClientRect().top;
 return {scrollY:window.scrollY,top,documentTop:top+window.scrollY,documentHeight:document.documentElement.scrollHeight};
};
function expectReadingPosition(before,after){
 // Absolute scrollY can legitimately track layout growth above the reader (for
 // example the asynchronous X embed). The reader must keep the same visible anchor.
 expect(Math.abs(after.top-before.top),JSON.stringify({before,after})).toBeLessThanOrEqual(1);
}

// Production document-scroll navigation, standalone emulation. The held viewport
// shell remains in PR83; this suite retains the same interactions and visible-bottom
// assertions against production fixed navigation, not a claim that iOS drift is fixed. Keyboard-height and tab switching are engine
// contracts, not claims of an installed iPhone keyboard/background reproduction.
for(const root of ['','/sunday-crew','/doge']){
 test(`production document-scroll navigation: ${root||'LOOG'}`,async({page,context,browserName},testInfo)=>{
  test.skip(testInfo.project.name==='desktop','Mobile shell is inactive on desktop.');
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  if(!root)testInfo.annotations.push({type:'fixture',description:'LOOG long matchup uses the committed Week 6 score snapshot via QA-only server preload; this tests layout, not live provider correctness.'});
  const samples=[],content=page.locator('html');
  const check=async(label)=>{
   const s=await page.locator('.appTabBar').evaluate(el=>{
    const r=el.getBoundingClientRect(),v=visualViewport,c=document.scrollingElement,style=getComputedStyle(el);
    return {path:location.pathname,scrollY,innerHeight,visibility:document.visibilityState,viewport:v?{height:v.height,offsetTop:v.offsetTop,scale:v.scale}:null,rect:{top:r.top,bottom:r.bottom,height:r.height},content:{scrollTop:c.scrollTop,scrollHeight:c.scrollHeight},bottom:parseFloat(style.bottom),transform:style.transform,position:style.position};
   });samples.push({label,...s});
   expect(s.position).toBe('fixed');expect(s.scrollY).toBe(s.content.scrollTop);
   await expect(page.locator('.appScrollContent')).toHaveCount(0);
   const visibleBottom=s.viewport?s.viewport.offsetTop+s.viewport.height:s.innerHeight;
   expect(Math.abs(visibleBottom-s.rect.bottom-s.bottom),JSON.stringify(s)).toBeLessThan(2);

  };
  const scroll=async y=>{await content.evaluate((el,y)=>el.scrollTo(0,y),y);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await check('scroll');};
  const inputScroll=async()=>{
   if(browserName==='webkit'&&testInfo.project.use.isMobile){
    testInfo.annotations.push({type:'limitation',description:'Mobile WebKit has no wheel support; programmatic content scroll here, narrow WebKit project uses real wheel input.'});
    await content.evaluate(e=>e.scrollBy(0,500));
   }else{await page.mouse.move(180,300);await page.mouse.wheel(0,500);}
   await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await check('input');
  };
  try{
   const home=root||'/';
   expect((await page.goto(home)).status()).toBe(200);await expect(page.locator('.appTabBar')).toBeVisible();await check('home');await inputScroll();
   // Use an actual client-side article link and preserve the existing back-to-top contract.
   const link=page.locator('a[href*="/articles/"]').first();
   const article=await link.getAttribute('href');await link.click();
   await expect(page).toHaveURL(new RegExp(article+'$'));await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);await inputScroll();
   for(const height of [844,500,844]){await page.setViewportSize({width:testInfo.project.use.viewport.width,height});for(const y of [0,400,100000,200,0])await scroll(y);}
   // Labelled fixture input: no existing article input or real keyboard is implied.
   await content.evaluate(e=>{const input=document.createElement('input');input.id='qa-focus-fixture';input.setAttribute('aria-label','QA focus fixture');input.style.cssText='display:block;margin:16px 16px 100px;width:240px;height:40px';document.body.append(input);});
   const input=page.getByRole('textbox',{name:'QA focus fixture'});await input.focus();await page.setViewportSize({width:testInfo.project.use.viewport.width,height:500});await input.press('End');await input.scrollIntoViewIfNeeded();
   await expect(input).toBeFocused();const focus=await input.boundingBox(),nav=await page.locator('.appTabBar').boundingBox();expect(focus.y).toBeGreaterThanOrEqual(0);expect(focus.y+focus.height).toBeLessThanOrEqual(nav.y);await check('focused-shrunken-viewport');
   await input.evaluate(e=>e.remove());await page.setViewportSize({width:testInfo.project.use.viewport.width,height:844});await scroll(400);
   const before=await content.evaluate(e=>e.scrollTop);const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await page.bringToFront();await other.close();
   if(browserName==='chromium'){const session=await context.newCDPSession(page);await session.send('Page.setWebLifecycleState',{state:'frozen'});await session.send('Page.setWebLifecycleState',{state:'active'});await session.detach();}
   else testInfo.annotations.push({type:'limitation',description:'WebKit tab switch tested; OS process suspension and installed-app resume unavailable.'});
   expect(await content.evaluate(e=>e.scrollTop)).toBe(before);await check('resume');
   await page.getByRole('button',{name:'More',exact:true}).click();await expect(page.getByRole('complementary',{name:'More and settings'})).toBeVisible();await page.getByRole('button',{name:'Close more menu'}).click();
   await page.goBack();await expect(page).toHaveURL(new RegExp(root?root+'/?$':'/$'));await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);await check('back');
   await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Scores',exact:true}).click();await expect(page).toHaveURL(/#scores$/);await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);await check('scores');
   await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Culture',exact:true}).click();await expect(page).toHaveURL(/#culture$/);await check('culture');
   await page.goBack();await expect(page).toHaveURL(/#scores$/);await check('hash-back');
   await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Teams',exact:true}).click();
   await expect(page).toHaveURL(new RegExp(root+'/teams$'));await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);
   for(const y of [0,400,100000,0])await scroll(y);await check('teams');
   await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Scores',exact:true}).click();await expect(page).toHaveURL(/#scores$/);
   // The QA server pins the committed LOOG score snapshot so the original
   // long matchup flow does not turn into a short "not this week" provider response.
   const matchup=root?await page.locator('a[href*="/matchups/"]').first().getAttribute('href'):'/matchups/skatt/hopkins-opus';
   expect((await page.goto(matchup)).status()).toBe(200);await expect(page.locator('main.matchupPage')).toBeVisible();await expect(page.locator('.matchupColumn')).toBeVisible();
   if(!root){
    await expect(page.locator('.matchupHeroSide h1')).toHaveText(["I'm a Skatt man",'Mr Hopkins Opus']);
    expect((await page.locator('.matchupColumn').innerText()).length).toBeGreaterThan(300);
    expect(await content.evaluate(e=>e.scrollHeight-e.clientHeight)).toBeGreaterThan(500);
   }
   for(const height of [844,500,844]){await page.setViewportSize({width:testInfo.project.use.viewport.width,height});for(const y of [0,400,100000,200,0])await scroll(y);}
   await inputScroll();await check('matchup');await page.goBack();await expect(page).toHaveURL(/#scores$/);await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);await check('matchup-back');
   await testInfo.attach('shell-after-flow',{body:await page.screenshot(),contentType:'image/png'});
  }finally{await testInfo.attach('viewport-samples',{body:JSON.stringify(samples,null,2),contentType:'application/json'});}
 });
}

test('reel viewers restore the standalone document position',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='desktop','Standalone mobile scroll-owner contract.');
 await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 // Media readiness only is stubbed; real components and user controls are tested.
 await page.route('**/reels-hls/**',route=>route.request().method()==='HEAD'?route.fulfill({status:200,body:''}):route.abort());
 await page.goto('/');const content=page.locator('html');
 const shelves=[page.getByRole('region',{name:/videos$/}).first(),page.getByRole('region',{name:'Also, from The Brief'})];
 for(const shelf of shelves){
  const watch=shelf.getByRole('button',{name:/^Watch /}).first();await expect(watch).toBeVisible();await watch.scrollIntoViewIfNeeded();
  // Playwright may scroll again while waiting for a late-loading card to stabilize.
  // Capture the user's actual opening position at click, before React opens the viewer.
  await watch.evaluate(el=>el.addEventListener('click',()=>{
   const top=el.getBoundingClientRect().top;
   window.__qaReelOpening={scrollY,top,documentTop:top+scrollY,documentHeight:document.documentElement.scrollHeight};
  },{capture:true,once:true}));
  await watch.click();const before=await page.evaluate(()=>window.__qaReelOpening);
  await expect(page.getByRole('dialog')).toBeVisible();expect(await page.locator('body').evaluate(e=>getComputedStyle(e).overflowY)).toBe('hidden');
  await page.getByRole('button',{name:'Close video',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  try{await expect(async()=>expectReadingPosition(before,await watch.evaluate(readingPosition))).toPass({timeout:10000});}
  finally{await testInfo.attach('reel-restoration',{body:JSON.stringify({shelf:await shelf.getAttribute('aria-label'),before,after:await watch.evaluate(readingPosition)}),contentType:'application/json'});}
  expect(await content.evaluate(e=>getComputedStyle(e).overflowY)).not.toBe('hidden');
 }
});

test('reading-position assertion accepts anchored reflow and rejects a real scroll jump',async({page})=>{
 // Reproduce the measured 528px false positive without relying on a live embed's timing.
 await page.setContent('<div id="above" style="height:1000px"></div><button id="anchor">Reading anchor</button><div style="height:2000px"></div>');
 const anchor=page.locator('#anchor');await page.evaluate(()=>scrollTo(0,800));
 const before=await anchor.evaluate(readingPosition);
 await page.evaluate(()=>{document.querySelector('#above').style.height='1528px';scrollTo(0,1328);});
 const anchored=await anchor.evaluate(readingPosition);
 expect(anchored.scrollY-before.scrollY).toBe(528);
 expect(anchored.documentTop-before.documentTop).toBe(528);
 expectReadingPosition(before,anchored);
 // Same document geometry, but genuinely wrong restoration: this must still fail.
 await page.evaluate(()=>scrollBy(0,100));const jumped=await anchor.evaluate(readingPosition);
 expect(()=>expectReadingPosition(before,jumped)).toThrow();
});


test('normal browser keeps document navigation and reel restoration',async({page},testInfo)=>{
 await page.route('**/reels-hls/**',route=>route.request().method()==='HEAD'?route.fulfill({status:200,body:''}):route.abort());
 expect((await page.goto('/')).status()).toBe(200);
 expect(await page.locator('html').evaluate(e=>e.classList.contains('standaloneApp'))).toBe(false);
 await expect(page.locator('.appScrollContent')).toHaveCount(0);
 await page.evaluate(()=>window.scrollTo(0,400));await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
 const article=page.locator('a[href*="/articles/"]').first();const path=await article.getAttribute('href');await article.click();await expect(page).toHaveURL(new RegExp(path+'$'));await page.goBack();await expect(page).toHaveURL(/\/$/);
 const watch=page.getByRole('region',{name:/videos$/}).first().getByRole('button',{name:/^Watch /}).first();await watch.scrollIntoViewIfNeeded();
 await watch.evaluate(el=>el.addEventListener('click',()=>{window.__qaBrowserReelOpening=scrollY;},{capture:true,once:true}));await watch.click();
 const before=await page.evaluate(()=>window.__qaBrowserReelOpening);await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close video',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(before);
 await expect(page.locator('.appScrollContent')).toHaveCount(0);
 await testInfo.attach('normal-browser-reel-restoration',{body:JSON.stringify({before,after:await page.evaluate(()=>scrollY)}),contentType:'application/json'});
});
