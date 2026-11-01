import {test,expect} from '../helpers/browser.mjs';
test.beforeEach(async({page})=>{
 await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));
});
test('desktop primary navigation sticks without a layout jump and keeps keyboard destinations',async({page})=>{
 test.skip(page.viewportSize().width<=760,'Desktop behavior');await page.goto('/');
 const nav=page.getByRole('navigation',{name:'Primary navigation'});
 await expect(nav).toBeVisible();await expect(nav).toHaveCSS('position','sticky');
 await expect(nav.getByRole('link',{name:'HOME',exact:true})).toHaveCSS('font-family','"Brief Editorial Sans", sans-serif');
 const main=await page.locator('main').boundingBox();await page.evaluate(()=>scrollTo({top:700,behavior:'instant'}));
 await expect.poll(async()=>Math.round((await nav.boundingBox()).y)).toBe(0);
 const y=await page.evaluate(()=>scrollY);expect((await page.locator('main').boundingBox()).y+y).toBeCloseTo(main.y,0);
 const more=nav.locator('summary');await more.focus();await page.keyboard.press('Enter');
 await expect(nav.getByRole('link',{name:'THE CRATES'})).toBeVisible();
 await expect(more).toHaveCSS('outline-width','2px');await page.keyboard.press('Enter');
 await nav.getByRole('link',{name:'CULTURE',exact:true}).click();
 await expect(page).toHaveURL(/#culture$/);await expect.poll(()=>page.locator('#culture').evaluate(e=>Math.abs(e.getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)-(parseFloat(getComputedStyle(e).scrollMarginTop)||0)))).toBeLessThan(2);
 await page.screenshot({path:'/workspace/font-qa/desktop-sticky-navigation.png'});
 await more.click();await nav.getByRole('link',{name:'THE CRATES'}).click();await expect(page).toHaveURL(/\/archive$/);
 await page.goBack();await expect(page).toHaveURL(/#culture$/);
 await page.setViewportSize({width:761,height:900});await expect(nav).toBeVisible();await expect(nav).toHaveCSS('position','sticky');
 await page.setViewportSize({width:760,height:900});await expect(nav).toBeHidden();await expect(page.getByRole('navigation',{name:'App navigation'})).toBeVisible();
});
test('mobile has one primary navigation and preserves League through More and history',async({page})=>{
 test.skip(page.viewportSize().width>760,'Mobile behavior');await page.goto('/articles/marnie-detroit-school');
 await expect(page.locator('.siteNav')).toBeHidden();const nav=page.getByRole('navigation',{name:'App navigation'});await expect(nav).toBeVisible();
 await nav.getByRole('button',{name:'More',exact:true}).click();
 const league=page.getByRole('link',{name:'The League',exact:true});await expect(league).toHaveAttribute('href','/#league');await league.click();
 await expect(page).toHaveURL(/\/#league$/);await expect.poll(()=>page.locator('#league').evaluate(e=>Math.abs(e.getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)-(parseFloat(getComputedStyle(e).scrollMarginTop)||0)))).toBeLessThan(2);
 await page.goBack();await expect(page).toHaveURL(/articles\/marnie-detroit-school$/);await expect(nav).toBeVisible();
 await page.screenshot({path:`/workspace/font-qa/mobile-single-navigation-${page.viewportSize().width}.png`});
 await page.goto('/doge/articles/maude-saturation-bombing-daniel-jones');await nav.getByRole('button',{name:'More',exact:true}).click();
 for(const [name,hash] of [['The League','league'],['Standings','standings'],['The Wire','transactions'],['Live Desk','live-desk']])await expect(page.getByRole('link',{name,exact:true})).toHaveAttribute('href','/doge#'+hash);
});
test('reader decorations are removed while section hierarchy, video and focus controls remain',async({page})=>{
 for(const slug of ['marnie-detroit-school','maude-saturation-bombing-daniel-jones']){
  await page.goto('/articles/'+slug);await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.articleRule')).toBeHidden();
  for(const element of await page.locator('.articleSectionHead,.articleImage').all()){
   await expect(element).toHaveCSS('border-top-width','0px');await expect(element).toHaveCSS('border-bottom-width','0px');
  }
  await expect(page.locator('.articleDek')).toHaveCSS('font-style','italic');await expect(page.locator('.articleBody p').first()).toHaveCSS('font-size','19px');
  const share=page.getByRole('button',{name:'Share this article'});await share.focus();await expect(share).toHaveCSS('outline-width','2px');
  if(slug==='marnie-detroit-school'){
   await expect(page.locator('video').first()).toHaveAttribute('controls','');
   await page.locator('.articleSectionHead').first().scrollIntoViewIfNeeded();
  }
  await page.screenshot({path:`/workspace/font-qa/reader-lines-${slug}-${page.viewportSize().width}.png`});
 }
 await page.goto('/');
 if(page.viewportSize().width<=760){const rows=page.locator('.mobileStoryRows > section');expect(await rows.nth(1).evaluate(e=>getComputedStyle(e,'::before').content)).toBe('""');}
});
