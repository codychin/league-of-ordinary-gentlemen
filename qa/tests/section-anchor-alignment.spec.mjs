import {test,expect} from '../helpers/browser.mjs';

async function userScroll(page,dy,testInfo){
 if(testInfo.project.use.isMobile&&testInfo.project.use.hasTouch){
  // Mobile WebKit has no wheel driver. Deliver genuine touch input to an
  // inert fixed fixture, then move document scroll; this tests cancellation,
  // not OS gesture physics. The desktop-input projects retain wheel coverage.
  await page.evaluate(()=>{const pad=document.createElement('div');pad.id='qa-touch-pad';pad.style.cssText='position:fixed;left:0;top:120px;width:44px;height:44px;z-index:2147483647';document.body.append(pad)});
  await page.locator('#qa-touch-pad').tap();
  await page.locator('#qa-touch-pad').evaluate(e=>e.remove());
  await page.evaluate(amount=>scrollBy({top:amount,behavior:'instant'}),dy);
 }else await page.mouse.wheel(0,dy);
}

async function expectLanding(page,id,mobile){
 await expect.poll(()=>page.locator('#'+id).evaluate((target,mobile)=>{
  const header=document.querySelector(mobile?'.appSectionHeader':'.siteNav');
  return Math.abs(target.getBoundingClientRect().top-header.getBoundingClientRect().bottom-(mobile?0:16+(parseFloat(getComputedStyle(target).scrollMarginTop)||0)));
 },mobile)).toBeLessThanOrEqual(1);
 if(mobile)expect(await page.locator('#'+id).evaluate(target=>{
  const header=document.querySelector('.appSectionHeader').getBoundingClientRect();
  return target.contains(document.elementFromPoint(innerWidth/2,header.bottom+2));
 })).toBe(true);
}

test('section taps, hashes and history align with the actual header in every edition',async({page},testInfo)=>{
 const mobile=page.viewportSize().width<=760;
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 for(const root of ['/','/doge','/sunday-crew'])for(const standalone of mobile?[false,true]:[false]){
  const home=root+(standalone?'?app-preview=1':'');
  await page.goto(home,{waitUntil:'domcontentloaded'});await expect(page.locator('html')).toHaveAttribute('data-app-tab','home');await page.evaluate(()=>document.fonts.ready);
  const nav=page.getByRole('navigation',{name:mobile?'App navigation':'Primary navigation',exact:true});
  // Begin with downward scrolling so the compact bottom-nav state is exercised.
  if(mobile){await userScroll(page,500,testInfo);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);}
  const second=mobile||root==='/'?'culture':'league';
  for(const id of ['scores',second]){
   await nav.getByRole('link',{name:new RegExp('^(THE )?'+id+'$','i')}).click();await expectLanding(page,id,mobile);
  }
  await page.goBack();await expectLanding(page,'scores',mobile);
  await page.goForward();await expectLanding(page,second,mobile);
  await page.screenshot({path:testInfo.outputPath(`anchor-after-${root==='/'?'loog':root.slice(1)}-${standalone}-${page.viewportSize().width}.png`)});
  if(mobile){
   await nav.getByRole('button',{name:'More',exact:true}).click();
   await page.getByRole('complementary',{name:'More and settings'}).getByRole('link',{name:'The League',exact:true}).click();
   await expectLanding(page,'league',true);
  }
  for(const id of ['scores','culture']){
   await page.goto(home+'#'+id,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await expectLanding(page,id,mobile);
  }
 }
});

test('late image layout changes retain the selected mobile section until user input',async({page},testInfo)=>{
 test.skip(page.viewportSize().width>760,'Mobile late-layout contract');
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 await page.route('**/qa-anchor-delayed.svg',async r=>{await new Promise(resolve=>setTimeout(resolve,700));await r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="gray"/></svg>'});});
 for(const root of ['/','/doge','/sunday-crew']){
  await page.goto(root,{waitUntil:'domcontentloaded'});await expect(page.locator('html')).toHaveAttribute('data-app-tab','home');await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{const wrapper=document.createElement('div');wrapper.id='qa-delayed-layout';const img=document.createElement('img');img.style.cssText='display:block;width:300px';img.src='/qa-anchor-delayed.svg';wrapper.append(img);document.querySelector('main').prepend(wrapper);});
  await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Culture',exact:true}).click();
  await expect.poll(()=>page.locator('#qa-delayed-layout img').evaluate(i=>i.complete&&i.naturalHeight===300)).toBe(true);await expectLanding(page,'culture',true);
  // Safe-area/header resizing changes the fixed header without requiring body growth.
  await page.locator('.appSectionHeader').evaluate(h=>h.style.paddingTop='59px');await expectLanding(page,'culture',true);
  await userScroll(page,180,testInfo);await page.waitForTimeout(150);
  await page.locator('#qa-delayed-layout').evaluate(e=>e.style.height='600px');
  await expect.poll(()=>page.locator('#culture').evaluate(e=>Math.abs(e.getBoundingClientRect().top-document.querySelector('.appSectionHeader').getBoundingClientRect().bottom))).toBeGreaterThan(20);
 }
});


test('the first lower story has one separator above Use Your Words',async({page},testInfo)=>{
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 for(const root of ['/','/doge','/sunday-crew']){
  await page.goto(root,{waitUntil:'domcontentloaded'});
  const first=page.locator('.mobileStoryRows > section').first();
  await expect(first.locator('h2')).toHaveText('Use Your Words.');
  await first.evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().top-150,behavior:'instant'}));
  const rule=await first.evaluate(e=>{const s=getComputedStyle(e,'::before');return{content:s.content,height:parseFloat(s.height),top:parseFloat(s.top),color:s.backgroundColor}});
  expect(rule.content).toBe('""');expect(rule.height).toBeGreaterThan(0);expect(rule.height).toBeLessThanOrEqual(1);expect(rule.top).toBe(-16);expect(rule.color).toBe(page.viewportSize().width<=760?'rgba(38, 36, 31, 0.35)':'rgba(38, 36, 31, 0.2)');
  await page.screenshot({path:testInfo.outputPath(`first-row-${root==='/'?'loog':root.slice(1)}-${page.viewportSize().width}.png`)});
 }
});

test('Culture pagination and floating masthead remain readable while the feed changes sections',async({page},testInfo)=>{
 const mobile=page.viewportSize().width<=760;
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 for(const root of ['/','/doge','/sunday-crew']){
  await page.goto(root,{waitUntil:'domcontentloaded'});await expect(page.locator('html')).toHaveAttribute('data-app-tab','home');
  const pagination=page.getByRole('navigation',{name:'Culture stories pagination'});
  await pagination.evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().top-400,behavior:'instant'}));
  await expect(pagination.getByRole('button',{name:'OLDER',exact:false})).toHaveCSS('color','rgb(245, 241, 232)');
  await expect(pagination.locator('span')).toHaveCSS('color','rgb(245, 241, 232)');
  await expect(pagination.getByRole('button',{name:'NEWER',exact:false})).toHaveCSS('opacity','1');
  await expect(pagination).toHaveCSS('border-top-width','0px');
  if(mobile){
   await expect(page.locator('.appTabBar')).toHaveAttribute('data-active-tab','culture');
   await expect(page.locator('.appSectionHeader')).toHaveAttribute('data-surface','culture');
   await expect(page.locator('.mobileBriefLogo')).toHaveCSS('color','rgb(245, 241, 232)');
   await expect(page.locator('.mobileBriefLogo img')).toHaveAttribute('src','/icons/ordinary-brief-masthead-light.svg');
   await page.screenshot({path:testInfo.outputPath(`culture-after-${root==='/'?'loog':root.slice(1)}-${page.viewportSize().width}.png`)});
   await page.locator('#scores').evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'}));
   await expect(page.locator('.appTabBar')).toHaveAttribute('data-active-tab','scores');
   await expect(page.locator('.appSectionHeader')).toHaveAttribute('data-surface','paper');
  }
 }
});

test('standalone feature category follows the photo with a compact gap',async({page},testInfo)=>{
 test.skip(page.viewportSize().width>760,'Mobile feature spacing');
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
 const feature=page.locator('main > .hero.heroStack').filter({has:page.getByRole('heading',{name:'The Medical Clearance Industrial Complex',exact:true})});
 const gap=await feature.evaluate(e=>e.querySelector('.eyebrow').getBoundingClientRect().top-e.querySelector('.photoHero').getBoundingClientRect().bottom);
 expect(gap).toBe(24);
 await feature.locator('.eyebrow').evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().top-200,behavior:'instant'}));
 await page.screenshot({path:testInfo.outputPath(`medical-gap-${page.viewportSize().width}.png`)});
});
