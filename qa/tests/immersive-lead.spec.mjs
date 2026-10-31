import {test,expect} from '../helpers/browser.mjs';
test.beforeEach(async({page})=>page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}})));
test('immersive lead preserves content, photo overlap, accessible backing and carousel rhythm',async({page})=>{
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const lead=page.locator('.immersiveLead'),photo=lead.locator('.sundayFeatureImage'),category=lead.locator('.sabinePackageIntro > small'),title=lead.locator('h2'),author=lead.locator('.previewAuthor'),deck=lead.locator('.sabinePackageIntro > p');
 await expect(title).toHaveText('A Study in Movement: The Detroit School, 2026');await expect(deck).toHaveText('On the spontaneous birth of an artistic movement, and the evolution of human expression.');await expect(deck).toHaveCSS('font-style','normal');await expect(deck).toHaveCSS('font-family','"Brief Body Reference 5", serif');await expect(title).toHaveCSS('font-family','"Brief Nine F Native Preview", Georgia, serif');
 await expect(lead.locator('.actionCaption')).toHaveCount(0);await expect(author.locator('time')).toHaveText('OCTOBER 26');await expect(author.locator('img')).toBeVisible();
 const [p,c,t,a,d,l,next]=await Promise.all([photo.boundingBox(),category.boundingBox(),title.boundingBox(),author.boundingBox(),deck.boundingBox(),lead.boundingBox(),page.locator('[aria-label="Recent stories"]').boundingBox()]);
 expect((c.y-p.y)/p.height).toBeGreaterThanOrEqual(.65);expect(c.y).toBeLessThan(p.y+p.height);expect(t.y).toBeLessThan(p.y+p.height);expect(a.y-t.y-t.height).toBeCloseTo(20,0);expect(d.y-a.y-a.height).toBeCloseTo(20,0);expect(next.y-l.y-l.height).toBeCloseTo(0,0);expect(next.y-d.y-d.height).toBeCloseTo(32,0);
 await expect(category).toHaveCSS('color','rgb(164, 61, 49)');await expect(category).toHaveCSS('opacity','1');await expect(title).toHaveCSS('color','rgb(38, 36, 31)');
 const gradient=await photo.evaluate(e=>getComputedStyle(e,'::after').backgroundImage);expect(gradient).toContain('rgba(245, 241, 232, 0.96) 65%');
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{timeout:5000}).toBe(true);
 if(page.viewportSize().width<=760){expect(p.x).toBeCloseTo(0,0);expect(p.width).toBe(page.viewportSize().width);await expect(page.locator('html')).toHaveCSS('color-scheme','light only');}else expect(p.width/p.height).toBeGreaterThan(1.7);
 await lead.scrollIntoViewIfNeeded();await page.screenshot({path:`/workspace/font-qa/immersive-lead-${page.viewportSize().width}.png`,animations:'disabled'});
 await photo.focus();await expect(photo).toHaveCSS('outline-width','2px');
 const before=await photo.boundingBox();await page.evaluate(()=>scrollBy({top:100,behavior:'instant'}));expect((await photo.boundingBox()).y).toBeCloseTo(before.y-100,0);
 await page.getByRole('link',{name:'A Study in Movement: The Detroit School, 2026',exact:true}).click();await expect(page).toHaveURL(/\/articles\/marnie-detroit-school$/);
});
test('immersive lead reflows at narrow, tablet and wide desktop boundaries',async({page})=>{
 test.skip(page.viewportSize().width<=760,'One breakpoint sweep');
 for(const width of [320,760,761,1001,1920]){
  await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
  const lead=page.locator('.immersiveLead');const photo=await lead.locator('.sundayFeatureImage').boundingBox(),category=await lead.locator('.sabinePackageIntro > small').boundingBox(),title=await lead.locator('h2').boundingBox();
  expect((category.y-photo.y)/photo.height).toBeGreaterThanOrEqual(.65);expect(title.y).toBeLessThan(photo.y+photo.height);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{timeout:5000}).toBe(true);
  expect(await lead.locator('.sundayFeatureCopy').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  await lead.screenshot({path:`/workspace/font-qa/immersive-boundary-${width}.png`,animations:'disabled'});
 }
});
