import {test,expect} from '../helpers/browser.mjs';
test('desktop hero limits enlargement and keeps copy, image, rail and editions intact',async({page})=>{
 test.skip(page.viewportSize().width<=760,'One desktop boundary and edition sweep');
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 for(const width of [761,1000,1001,1440,1920]){
  await page.setViewportSize({width,height:1000});
  for(const root of width===1440?['/','/doge','/sunday-crew']:['/']){
   await page.goto(root);await page.evaluate(()=>document.fonts.ready);
   const hero=page.locator('.immersiveLead'),photo=hero.locator('.sundayFeatureImage'),title=hero.locator('h2'),copy=hero.locator('.sundayFeatureCopy'),deck=hero.locator('.sabinePackageIntro > p');
   const h=await hero.boundingBox(),p=await photo.boundingBox(),t=await title.boundingBox(),c=await copy.boundingBox(),d=await deck.boundingBox(),next=await page.locator('[aria-label="Recent stories"]').boundingBox();
   expect(p.width).toBeLessThanOrEqual(780);expect(p.x+p.width).toBeCloseTo(h.x+h.width,0);expect(p.y).toBeCloseTo(h.y,0);
   expect(t.x).toBeLessThan(p.x);expect(t.x+t.width).toBeGreaterThan(p.x);expect(t.y+t.height).toBeLessThanOrEqual(p.y+p.height);
   expect(c.y).toBeCloseTo(h.y,0);expect(next.y-d.y-d.height).toBeCloseTo(40,0);
   await expect(photo.locator('img')).toHaveAttribute('src',/\/images\/(?:editorial\/detroit-school\/homepage-gibbs-dance|cache\/d2d3f60c50dda69c10e0-(?:320|640|1280))\.webp$/);await expect(photo.locator('img')).toHaveCSS('object-position','50% 0%');
   expect(await photo.evaluate(e=>getComputedStyle(e,'::after').backgroundImage)).toContain('90deg');
   const shelf=page.locator('[data-matchup-layout="compact"]');await expect(shelf.locator('button[aria-label^="Watch "]')).toHaveCount(6);
   if(width>=1440)expect((await shelf.boundingBox()).width).toBeGreaterThan(1100);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
});
