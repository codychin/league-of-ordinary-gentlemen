import fs from 'node:fs';
import crypto from 'node:crypto';
import {test,expect} from '../helpers/browser.mjs';
const reference=JSON.parse(fs.readFileSync(new URL('../fixtures/approved-web-hero.json',import.meta.url)));
test('approved mobile hero composition is preserved across editions and system appearances',async({page})=>{
 test.skip(page.viewportSize().width<=760,'One explicit mobile edition and breakpoint sweep');
 const bytes=fs.readFileSync(new URL('../../'+reference.sourceImage,import.meta.url));
 expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(reference.sourceImageSha256);
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));
 for(const width of [320,440,760]){
  await page.setViewportSize({width,height:1000});let expected;
  for(const route of ['/','/doge','/sunday-crew'])for(const colorScheme of ['light','dark']){
   await page.emulateMedia({colorScheme,reducedMotion:'reduce'});await page.goto(route);await page.evaluate(()=>document.fonts.ready);
   const hero=page.locator('.immersiveLead');await expect(hero.locator('.sundayFeatureImage img')).toBeVisible();
   const state=await hero.evaluate(e=>{const photo=e.querySelector('.sundayFeatureImage'),copy=e.querySelector('.sundayFeatureCopy'),category=e.querySelector('.sabinePackageIntro > small'),title=e.querySelector('h2'),deck=e.querySelector('.sabinePackageIntro > p'),next=document.querySelector('[aria-label="Recent stories"]');const p=photo.getBoundingClientRect(),c=category.getBoundingClientRect(),t=title.getBoundingClientRect(),d=deck.getBoundingClientRect();return{photoHeight:p.height,photoWidth:p.width,overlap:-parseFloat(getComputedStyle(copy).marginTop),categoryTop:c.top-p.top,titleTop:t.top-p.top,copyInset:copy.getBoundingClientRect().left-p.left,headlineSize:getComputedStyle(title).fontSize,headlineLeading:getComputedStyle(title).lineHeight,gap:next.getBoundingClientRect().top-d.bottom,fit:getComputedStyle(photo.querySelector('img')).objectFit,position:getComputedStyle(photo.querySelector('img')).objectPosition,gradient:getComputedStyle(photo,'::after').backgroundImage,categoryColor:getComputedStyle(category).color,headlineColor:getComputedStyle(title).color,paper:getComputedStyle(e).backgroundColor}});
   expect(state.fit).toBe('cover');expect(state.position).toBe('50% 0%');expect(state.gap).toBeCloseTo(40,0);
   expect(state.categoryColor).toBe('rgb(164, 61, 49)');expect(state.headlineColor).toBe('rgb(38, 36, 31)');expect(state.paper).toBe('rgb(245, 241, 232)');
   for(const offset of reference.gradientOffsetsFromCopy)expect(state.gradient).toContain(`calc(100% - ${state.overlap-offset}px)`);
   expect(state.gradient).toContain('rgba(245, 241, 232, 0.49)');expect(state.gradient).toContain('rgba(245, 241, 232, 0.73)');
   if(width===440){await expect(page.locator('.mobileBriefLogo img')).toBeHidden();await expect(page.locator('.appSectionHeader')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');expect(await page.locator('.appSectionHeader').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('0.64');expect(state.photoHeight).toBe(440);expect(state.overlap).toBe(160);expect(state.categoryTop).toBe(280);expect(state.titleTop).toBe(320);expect(state.copyInset).toBe(20);expect(state.headlineSize).toBe('31px');expect(state.headlineLeading).toBe('35px');await expect(page.locator('html')).toHaveCSS('color-scheme','light only');}
   if(expected)expect(state).toEqual(expected);else expected=state;
   await expect(hero.locator('.sabinePackageIntro > small')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  }
 }
});
