import {test,expect} from '../helpers/browser.mjs';
const carousel=['maude-nfc-east-declines-winner','sabine-and-you-are','marnie-marvin-harrison-somewhere-else'];
const rows=['marnie-hecklinski-use-your-words','marnie-time-traveling-goblin-paradox','conrad-tomlin-minecraft-cvs','marnie-corgi-he-wanted-them-to-know','marnie-tee-higgins-ankles','dashiell-jaguars-london-future'];
test('mobile editorial parity keeps cohorts, fullbleed features, spacing and persistent logo',async({page})=>{
 await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const mobile=page.viewportSize().width<=760;
 for(const [selector,slugs] of [['.mobileLowerCarousel',carousel],['.mobileStoryRows',rows]]) {
  const actual=await page.locator(selector+' a[href*="/articles/"]').evaluateAll(links=>[...new Set(links.map(a=>a.pathname.split('/').pop()))]);expect(actual).toEqual(slugs);
 }
 await expect(page.locator('[aria-label="Recent stories"] > article')).toHaveCount(3);
 await expect(page.locator('.mobileLowerCarousel > section')).toHaveCount(3);
 await expect(page.locator('.mobileStoryRows > section')).toHaveCount(6);
 const lead=page.locator('[data-editorial-layout="open-top"]');
 const [lt,la,ld]=await Promise.all([lead.locator('h2').boundingBox(),lead.locator('.previewAuthor').boundingBox(),lead.locator('.sabinePackageIntro > p').boundingBox()]);
 expect(la.y).toBeGreaterThanOrEqual(lt.y+lt.height);expect(ld.y).toBeGreaterThanOrEqual(la.y+la.height);
 await expect(lead.locator('.previewAuthor strong')).toHaveCSS('font-size','12px');
 await expect(lead.locator('.previewAuthor img')).toHaveCSS('width','24px');
 if(!mobile){await expect(page.locator('.mobileLowerCarousel')).toHaveCSS('display','contents');await expect(page.locator('.mast')).toBeVisible();return;}
 await expect(page.locator('.mobileLowerCarousel')).toHaveCSS('display','flex');
 await expect(page.locator('[data-editorial-layout="open-top"] .sundayFeature')).toHaveCSS('overflow-x','visible');
 const logo=page.locator('.mobileBriefLogo'),before=await logo.boundingBox();
 for(const selector of ['[data-editorial-layout="open-top"] .sundayFeatureImage','main > .hero.heroStack .photoHero']) {
  for(const image of await page.locator(selector).all()){const box=await image.boundingBox();expect(Math.abs(box.x)).toBeLessThan(1);expect(Math.abs(box.width-page.viewportSize().width)).toBeLessThan(1);}
 }
 const feature=page.locator('main > .hero.heroStack').first();
 const photo=await feature.locator('.photoHero').boundingBox(),category=await feature.locator('.eyebrow').boundingBox();expect(category.y-photo.y-photo.height).toBeCloseTo(40,0);
 await expect(feature.locator('h2')).toHaveCSS('margin-top','16px');
 await expect(feature.locator('h2')).toHaveCSS('margin-bottom','12px');
 const deck=await feature.locator('.standfirst').boundingBox(),writer=await feature.locator('.previewAuthor').boundingBox();expect(deck.y-writer.y-writer.height).toBeCloseTo(12,0);
 await page.locator('.mobileStoryRows').scrollIntoViewIfNeeded();
 expect((await logo.boundingBox()).y).toBe(before.y);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.mobileStoryRows video').last()).toHaveAttribute('controls','');
 await expect(page.locator('.mobileStoryRows .hero-copy').first()).toHaveCSS('display','grid');
 const row=page.locator('.mobileStoryRows .hero').first();
 await expect(row.locator('.photoHero')).toHaveCSS('width','64px');
 await expect(row.locator('.photoHero')).toHaveCSS('height','48px');
 await expect(row.locator('h2')).toHaveCSS('font-size','18px');
 await expect(row.locator('h2')).toHaveCSS('line-height','21px');
 const titleBox=await row.locator('h2').boundingBox(),imageBox=await row.locator('.photoHero').boundingBox(),rowDeck=await row.locator('.standfirst').boundingBox();
 await expect(row.locator('.previewAuthor')).toBeHidden();
 await expect(row.locator('.standfirst')).toHaveText('An Iowa quarterback and the quiet courage of asking for what you need.');
 await expect(row.locator('.standfirst')).toHaveCSS('font-size','14px');
 expect(rowDeck.y-titleBox.y-titleBox.height).toBeCloseTo(12,0);
 expect(imageBox.y).toBeCloseTo(rowDeck.y,0);expect(imageBox.x-rowDeck.x-rowDeck.width).toBeCloseTo(16,0);
 await expect(row).toHaveCSS('margin-bottom','24px');
 await expect(page.locator('.mobileStoryRows .sundayFeatureImage')).toHaveCSS('height','48px');
 await page.screenshot({path:`/workspace/font-qa/mobile-parity-rows-${page.viewportSize().width}.png`});
 await page.locator('.mobileLowerCarousel').scrollIntoViewIfNeeded();
 await page.screenshot({path:`/workspace/font-qa/mobile-parity-carousel-${page.viewportSize().width}.png`});
 await page.locator('[data-editorial-layout="open-top"]').scrollIntoViewIfNeeded();
 await page.screenshot({path:`/workspace/font-qa/mobile-parity-lead-${page.viewportSize().width}.png`});
});
test('reader uses title-author-italic-deck order and no decorative post-credit rule',async({page})=>{
 await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));
 await page.goto('/articles/maude-saturation-bombing-daniel-jones');await page.evaluate(()=>document.fonts.ready);
 const deck=page.locator('.articleDek'),writer=page.locator('.articleBylineShare'),photo=page.locator('.articleImage').first();
 await expect(deck).toHaveCSS('font-style','italic');await expect(deck).toHaveCSS('font-synthesis','none');
 const [a,b,c,t]=await Promise.all([deck.boundingBox(),writer.boundingBox(),photo.boundingBox(),page.locator('.articleTitle').boundingBox()]);
 expect(b.y-t.y-t.height).toBeCloseTo(12,0);expect(a.y-b.y-b.height).toBeCloseTo(12,0);expect(c.y-a.y-a.height).toBeCloseTo(24,0);
 if(page.viewportSize().width<=760)await expect(page.locator('.articleRule')).toBeHidden();
 const res=await page.request.get('/fonts/liberation-sans/LiberationSans-Italic.ttf');expect(res.status()).toBe(200);
 const {createHash}=await import('node:crypto');expect(createHash('sha256').update(await res.body()).digest('hex')).toBe('93ff5260834141b6f9d8f2b846d427f3a5dc492dbdce8ebdad406e38a38f34bb');
 await page.screenshot({path:`/workspace/font-qa/final-reader-${page.viewportSize().width}.png`});
});
