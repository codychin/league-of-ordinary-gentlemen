import {test,expect} from '@playwright/test';

// Real shell, standalone emulation. Keyboard-height and tab switching are engine
// contracts, not claims of an installed iPhone keyboard/background reproduction.
for(const root of ['','/sunday-crew','/doge']){
 test(`standalone content scroll owner: ${root||'LOOG'}`,async({page,context,browserName},testInfo)=>{
  test.skip(testInfo.project.name==='desktop','Mobile shell is inactive on desktop.');
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  const samples=[],content=page.locator('.appScrollContent');
  const check=async(label)=>{
   const s=await page.locator('.appTabBar').evaluate(el=>{
    const r=el.getBoundingClientRect(),v=visualViewport,c=document.querySelector('.appScrollContent'),cr=c.getBoundingClientRect(),style=getComputedStyle(el);
    return {path:location.pathname,scrollY,innerHeight,visibility:document.visibilityState,viewport:{height:v.height,offsetTop:v.offsetTop,scale:v.scale},rect:{top:r.top,bottom:r.bottom,height:r.height},content:{top:cr.top,bottom:cr.bottom,scrollTop:c.scrollTop,scrollHeight:c.scrollHeight},margin:parseFloat(style.marginBottom),transform:style.transform,position:style.position};
   });samples.push({label,...s});
   expect(s.position).toBe('relative');expect(s.transform).toBe('none');expect(s.scrollY).toBe(0);
   expect(Math.abs(s.innerHeight-s.rect.bottom-s.margin),JSON.stringify(s)).toBeLessThan(2);
   expect(s.content.bottom).toBeLessThanOrEqual(s.rect.top);
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
   await content.evaluate(e=>{const input=document.createElement('input');input.id='qa-focus-fixture';input.setAttribute('aria-label','QA focus fixture');input.style.cssText='display:block;margin:16px;width:240px;height:40px';e.append(input);});
   const input=page.getByRole('textbox',{name:'QA focus fixture'});await input.focus();await page.setViewportSize({width:testInfo.project.use.viewport.width,height:500});await input.press('End');await input.scrollIntoViewIfNeeded();
   await expect(input).toBeFocused();const focus=await input.boundingBox(),region=await content.boundingBox();expect(focus.y).toBeGreaterThanOrEqual(region.y);expect(focus.y+focus.height).toBeLessThanOrEqual(region.y+region.height);await check('focused-shrunken-viewport');
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
   await testInfo.attach('shell-after-flow',{body:await page.screenshot(),contentType:'image/png'});
  }finally{await testInfo.attach('viewport-samples',{body:JSON.stringify(samples,null,2),contentType:'application/json'});}
 });
}

test('reel viewers restore the standalone content position',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='desktop','Standalone mobile scroll-owner contract.');
 await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 // Media readiness only is stubbed; real components and user controls are tested.
 await page.route('**/reels-hls/**',route=>route.request().method()==='HEAD'?route.fulfill({status:200,body:''}):route.abort());
 await page.goto('/');const content=page.locator('.appScrollContent');
 const shelves=[page.getByRole('region',{name:/videos$/}).first(),page.getByRole('region',{name:'Also, from The Brief'})];
 for(const shelf of shelves){
  const watch=shelf.getByRole('button',{name:/^Watch /}).first();await expect(watch).toBeVisible();await watch.scrollIntoViewIfNeeded();
  // Playwright may scroll again while waiting for a late-loading card to stabilize.
  // Capture the user's actual opening position at click, before React opens the viewer.
  await watch.evaluate(el=>el.addEventListener('click',()=>{window.__qaReelOpening=document.querySelector('.appScrollContent').scrollTop;},{capture:true,once:true}));
  await watch.click();const before=await page.evaluate(()=>window.__qaReelOpening);
  await expect(page.getByRole('dialog')).toBeVisible();expect(await content.evaluate(e=>getComputedStyle(e).overflowY)).toBe('hidden');
  await page.getByRole('button',{name:'Close video',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await testInfo.attach('reel-restoration',{body:JSON.stringify({before,after:await content.evaluate(e=>e.scrollTop)}),contentType:'application/json'});await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(before);expect(await content.evaluate(e=>getComputedStyle(e).overflowY)).toBe('auto');
 }
});
