import {test,expect} from '../helpers/browser.mjs';
for(const root of ['', '/sunday-crew','/doge'])test(`article date and author portrait alignment ${root||'loog'}`,async({page},testInfo)=>{
 await page.goto(`${root}/articles/hollis-chargers-thought-of-everything`);
 await page.evaluate(()=>document.fonts.ready);
 const date=page.locator('.articleTitle + .articleDate');
 await expect(date).toHaveText('NOVEMBER 7, 2026');
 await expect(page.locator('.byline time')).toHaveCount(0);
 const photo=page.locator('.bylineWriter img'),text=page.locator('.bylineWriter span');
 await expect.poll(()=>photo.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 const [titleBox,dateBox,writerBox,p,t]=await Promise.all([page.locator('.articleTitle').boundingBox(),date.boundingBox(),page.locator('.articleBylineShare').boundingBox(),photo.boundingBox(),text.boundingBox()]);
 expect(dateBox.y).toBeGreaterThanOrEqual(titleBox.y+titleBox.height);
 expect(writerBox.y).toBeGreaterThanOrEqual(dateBox.y+dateBox.height);
 expect(p.width).toBe(48);expect(p.height).toBe(48);
 expect(Math.abs((p.y+p.height/2)-(t.y+t.height/2))).toBeLessThanOrEqual(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.articleBylineShare').screenshot({path:testInfo.outputPath('author-alignment.png')});
});
