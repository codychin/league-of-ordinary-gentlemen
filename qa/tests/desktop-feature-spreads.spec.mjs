import {test,expect} from '../helpers/browser.mjs';
const labels=['Conrad Sorrell on medical clearance','Hollis Crane on the Rams kicker swap'];
const slugs=['conrad-jalen-hurts-too-sick-to-sleep','hollis-rams-kicker-weight'];
for(const root of ['', '/doge', '/sunday-crew']){
 test(`${root||'Brief'} desktop spreads retain sequence, links and mobile image-first flow`,async({page},testInfo)=>{
  // Read-only comments fixture keeps article-link QA independent of external service availability.
  await page.route('**/functions/v1/brief-comments?*',r=>r.fulfill({json:{comments:[],votes:[]}}));
  await page.goto(root||'/');await page.evaluate(()=>document.fonts.ready);
  const first=page.getByRole('region',{name:labels[0],exact:true});
  const second=page.getByRole('region',{name:labels[1],exact:true});
  await expect(first).toBeVisible();await expect(second).toBeVisible();
  const sequence=await page.locator('main > section[data-editorial-system="a"]').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));
  expect(sequence.indexOf(labels[1])).toBe(sequence.indexOf(labels[0])+1);
  expect(sequence.indexOf('Recent stories')).toBeLessThan(sequence.indexOf(labels[0]));
  await expect(page.locator('[aria-label="Recent stories"] > article')).toHaveCount(3);
  await expect(page.locator('.mobileLowerCarousel > section')).toHaveCount(3);
  await expect(page.locator('.mobileStoryRows > section')).toHaveCount(4);
  for(let i=0;i<2;i++){
   const feature=i?second:first;const link=feature.locator('a.hero-copy');await expect(link).toHaveAttribute('href',`${root}/articles/${slugs[i]}`);
   const geometry=await link.evaluate(e=>{const box=el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};};return {all:box(e),photo:box(e.querySelector('.photoHero')),category:box(e.querySelector('.eyebrow')),title:box(e.querySelector('h2')),author:box(e.querySelector('.previewAuthor')),deck:box(e.querySelector('.standfirst')),overflow:e.scrollWidth>e.clientWidth};});
   const {all,photo,category,title,author,deck}=geometry;if(page.viewportSize().width>=980)expect(geometry.overflow).toBe(false);
   expect(author.y-title.y-title.h).toBeCloseTo(20,0);expect(deck.y-author.y-author.h).toBeCloseTo(20,0);
   if(page.viewportSize().width>=980){
    expect(photo.w/(all.w-36)).toBeCloseTo(.55,2);
    expect(Math.abs((title.x+title.w/2)-(author.x+author.w/2))).toBeLessThan(1);
    expect(Math.abs((photo.y+photo.h/2)-(category.y+(deck.y+deck.h-category.y)/2))).toBeLessThan(1);
    if(i===0)expect(title.x+title.w).toBeLessThan(photo.x);else expect(photo.x+photo.w).toBeLessThan(title.x);
    expect(title.h).toBeLessThan(180);
   } else if(page.viewportSize().width<=760){
    expect(photo.x).toBeCloseTo(0,0);expect(photo.w).toBeCloseTo(page.viewportSize().width,0);
    expect(category.y-photo.y-photo.h).toBeCloseTo(24,0);
    expect(title.y).toBeGreaterThan(category.y+category.h);
   }else expect(title.y).toBeGreaterThan(photo.y+photo.h);
   await link.focus();await expect(link).toBeFocused();await expect(link).toHaveCSS('outline-style','solid');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await second.locator('a.hero-copy').click();await expect(page).toHaveURL(new RegExp(`${root}/articles/${slugs[1]}$`));await expect(page.locator('h1')).toContainText('Rams');await page.waitForLoadState('networkidle');
 });
}
test('spread breakpoint and long-copy growth remain contained',async({page})=>{
 test.skip(page.viewportSize().width<980,'Desktop breakpoint coverage');
 await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 for(const width of [979,980,1165,1920]){
  await page.setViewportSize({width,height:1000});
  const feature=page.getByRole('region',{name:labels[0],exact:true});
  const b=await feature.evaluate(e=>{const p=e.querySelector('.photoHero').getBoundingClientRect(),t=e.querySelector('h2').getBoundingClientRect();return {px:p.x,py:p.y,pw:p.width,ph:p.height,tx:t.x,ty:t.y,tw:t.width};});
  if(width<980)expect(b.ty).toBeGreaterThan(b.py+b.ph);else expect(b.tx+b.tw).toBeLessThan(b.px);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:980,height:800});
 await page.getByRole('region',{name:labels[0],exact:true}).locator('h2').evaluate(e=>{e.style.fontSize='60px';});
 const growth=await page.getByRole('region',{name:labels[0],exact:true}).evaluate(e=>{const r=e.getBoundingClientRect(),p=e.querySelector('.standfirst').getBoundingClientRect();return {bottom:r.bottom,deckBottom:p.bottom};});
 expect(growth.deckBottom).toBeLessThanOrEqual(growth.bottom);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
const readingOrder=['hollis-chargers-thought-of-everything','maude-baker-comparative-merits-of-abstention','marnie-detroit-school','maude-saturation-bombing-daniel-jones','conrad-allow-me-to-reintroduce-myself','marnie-delicate-etiquette-sporting-pat','conrad-jalen-hurts-too-sick-to-sleep','hollis-rams-kicker-weight','maude-nfc-east-declines-winner','sabine-and-you-are','marnie-marvin-harrison-somewhere-else','marnie-hecklinski-use-your-words','marnie-time-traveling-goblin-paradox','conrad-tomlin-minecraft-cvs','marnie-corgi-he-wanted-them-to-know'];
for(const root of ['', '/doge', '/sunday-crew']){
 test(`${root||'Brief'} complete feed keeps ordered unique stories and operable secondary carousel`,async({page})=>{
  await page.route('**/functions/v1/brief-comments?*',r=>r.fulfill({json:{comments:[],votes:[]}}));
  await page.goto(root||'/');await page.evaluate(()=>document.fonts.ready);
  const actual=await page.locator('main > [data-editorial-layout] a[href*="/articles/"], [aria-label="Recent stories"] a[href*="/articles/"], main > .hero a[href*="/articles/"], .mobileLowerCarousel a[href*="/articles/"], .mobileStoryRows a[href*="/articles/"]').evaluateAll(es=>[...new Set(es.map(e=>e.pathname.split('/').pop()))]);expect(actual).toEqual(readingOrder);
  const containers=page.locator('main > [data-editorial-layout], [aria-label="Recent stories"] > article, main > .hero, .mobileLowerCarousel > section, .mobileStoryRows > section');
  expect(await containers.evaluateAll(es=>es.map(e=>e.querySelector('a[href*="/articles/"]').pathname.split('/').pop()))).toEqual(readingOrder);
  const rail=page.locator('.mobileLowerCarousel'),cards=rail.locator(':scope > section');await expect(cards).toHaveCount(3);
  await expect(page.locator('.mobileStoryRows > section')).toHaveCount(4);
  const desktop=page.viewportSize().width>=980;
  if(desktop){
   const next=page.getByRole('button',{name:'Next editorial stories',exact:true}),prev=page.getByRole('button',{name:'Previous editorial stories',exact:true});
   await expect(next).toBeVisible();await expect(prev).toBeDisabled();await expect(next).toBeEnabled();
   await cards.last().locator('a').focus();await expect(cards.last().locator('a')).toBeFocused();await expect(cards.last().locator('a')).toHaveCSS('outline-style','solid');
   await rail.focus();await page.keyboard.press('Home');await expect(prev).toBeDisabled();
   await next.click();await expect(next).toBeDisabled();await expect(prev).toBeEnabled();
   const end=await rail.evaluate(e=>e.scrollWidth-e.clientWidth-e.scrollLeft);expect(Math.abs(end)).toBeLessThan(2);
   await prev.click();await expect(prev).toBeDisabled();
   await rail.focus();await page.keyboard.press('End');await expect(next).toBeDisabled();await page.keyboard.press('Home');await expect(prev).toBeDisabled();
   await page.emulateMedia({reducedMotion:'reduce'});await rail.focus();await page.keyboard.press('ArrowRight');await expect(next).toBeDisabled();
   const row=page.locator('.mobileStoryRows > section.hero').first();const rb=await row.boundingBox();expect(rb.height).toBeLessThan(450);
   const title=await row.locator('h2').boundingBox(),photo=await row.locator('.photoHero').boundingBox();expect(title.x+title.width).toBeLessThan(photo.x);
  }else{
   await expect(page.getByRole('button',{name:'Next editorial stories',exact:true})).toBeHidden();
   await expect(rail).toHaveCSS('display',page.viewportSize().width<=760?'flex':'contents');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto(`${root}/archive`);
  const link=page.locator(`a[href="${root}/articles/dashiell-jaguars-london-future"]`);await expect(link).toHaveCount(1);
  await link.click();await expect(page).toHaveURL(new RegExp(`${root}/articles/dashiell-jaguars-london-future$`));await expect(page.locator('h1')).toBeVisible();
 });
}
for(const root of ['', '/doge', '/sunday-crew']){
 test(`${root||'Brief'} desktop league continuation uses current typography without changing table semantics`,async({page})=>{
  test.skip(page.viewportSize().width<980,'Desktop-only league styling');
  await page.goto(root||'/');await page.evaluate(()=>document.fonts.ready);
  const autopsy=page.locator('.autopsySection'),table=page.locator('.standingsTable');
  await expect(autopsy.locator('h2')).toHaveCSS('font-family',/Brief Nine F/);await expect(autopsy.locator('h2')).toHaveCSS('font-size','32px');
  await expect(autopsy.locator('.autopsyLead > p')).toHaveCSS('font-family',/Brief Body Reference 5/);await expect(autopsy.locator('.autopsyLead > p')).toHaveCSS('line-height','28px');
  await expect(autopsy).toHaveCSS('border-top-width','1px');await expect(autopsy.locator('.autopsyLead')).toHaveCSS('border-bottom-width','0px');
  await expect(page.locator('.standingsWrap')).toHaveCSS('border-top-width','1px');
  expect(await table.locator('tbody tr').count()).toBeGreaterThan(0);
  for(const header of ['FRANCHISE','W-L','PF','PA'])await expect(table.getByRole('columnheader',{name:header,exact:true})).toBeVisible();
  await expect(table.locator('tbody tr').first().locator('td').nth(1)).toHaveCSS('font-family',/Brief Body Reference 5/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('desktop rail animates continuously and reduced motion is immediate',async({page})=>{
 test.skip(page.viewportSize().width<980,'Desktop-only controls');await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const rail=page.locator('.mobileLowerCarousel'),next=page.getByRole('button',{name:'Next editorial stories',exact:true});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await rail.evaluate(e=>{e.__motion=[];e.__record=true;const sample=()=>{e.__motion.push(e.scrollLeft);if(e.__record)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 await next.click();await expect(next).toBeDisabled();
 const motion=await rail.evaluate(e=>{e.__record=false;return {positions:e.__motion,max:e.scrollWidth-e.clientWidth};});expect(motion.positions.some(x=>x>0&&x<motion.max-1)).toBe(true);
 await rail.focus();await page.keyboard.press('Home');await expect(next).toBeEnabled();await page.emulateMedia({reducedMotion:'reduce'});await next.click();
 expect(await rail.evaluate(e=>({end:e.scrollLeft>=e.scrollWidth-e.clientWidth-1,animating:e.hasAttribute('data-animating')}))).toEqual({end:true,animating:false});
});

for(const root of ['', '/doge', '/sunday-crew']){
 test(`${root||'Brief'} white web paper preserves inverse Culture at every width`,async({page})=>{
  await page.goto(root||'/');
  const desktop=page.viewportSize().width>=980;
  const paper='rgb(255, 255, 255)';
  await expect(page.locator('.immersiveLead')).toHaveCSS('background-color',paper);
  await expect(page.locator('#culture')).toHaveCSS('background-color','rgb(23, 22, 19)');
  await expect(page.locator('#culture')).toHaveCSS('color','rgb(245, 241, 232)');
  if(desktop){
   await expect(page.locator('body')).toHaveCSS('background-color',paper);
   await expect(page.locator('.siteNav')).toHaveCSS('background-color',paper);
   const fade=await page.locator('.immersiveLead .sundayFeatureImage').evaluate(e=>getComputedStyle(e,'::after').backgroundImage);
   expect(fade).toContain('255, 255, 255');expect(fade).not.toContain('245, 241, 232');
   const cream=await page.locator('main [data-editorial-system="a"]:not(#culture)').evaluateAll(es=>es.filter(e=>!e.closest('#culture')&&getComputedStyle(e).backgroundColor==='rgb(245, 241, 232)').length);
   expect(cream).toBe(0);
  }
 });
}

for(const root of ['', '/doge', '/sunday-crew']){
 test(`${root||'Brief'} standalone light paper and manifest agree without recoloring Culture`,async({page,request})=>{
  test.skip(page.viewportSize().width>760,'Standalone mobile surface');
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto(`${root||'/'}?app-preview=1`);
  await expect(page.locator('html')).toHaveClass(/standaloneApp/);
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content','#ffffff');
  const manifest=await (await request.get(root?`${root}/manifest.webmanifest`:'/manifest.webmanifest')).json();
  expect(manifest.background_color).toBe('#ffffff');expect(manifest.theme_color).toBe('#ffffff');
  const glider=await page.locator('.appTabGlider').evaluate(e=>getComputedStyle(e,'::after').backgroundColor);
  expect(glider).toBe('rgb(255, 255, 255)');
  const cream=await page.locator('body *').evaluateAll(es=>es.filter(e=>{const b=e.getBoundingClientRect();return b.width>200&&b.height>30&&!e.closest('#culture')&&['rgb(245, 241, 232)','rgb(243, 239, 229)'].includes(getComputedStyle(e).backgroundColor)}).map(e=>e.className));
  expect(cream).toEqual([]);
  await page.goto(`${root||'/'}?app-preview=1&tab=culture`);
  await expect(page.locator('#culture')).toBeVisible();
  await expect(page.locator('#culture')).toHaveCSS('background-color','rgb(23, 22, 19)');
  await expect(page.locator('#culture')).toHaveCSS('color','rgb(245, 241, 232)');
  await page.route('**/functions/v1/brief-comments?*',r=>r.fulfill({json:{comments:[],votes:[]}}));
  for(const path of [`${root}/archive`,`${root}/articles/marnie-detroit-school`]){
   await page.goto(path);
   await expect(page.locator('main')).toHaveCSS('background-color','rgb(255, 255, 255)');
   await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  }
 });
}
