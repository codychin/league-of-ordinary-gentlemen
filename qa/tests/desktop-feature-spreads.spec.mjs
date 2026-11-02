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
  await expect(page.locator('.mobileStoryRows > section')).toHaveCount(5);
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
