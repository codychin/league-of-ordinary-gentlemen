import {test,expect} from '../helpers/browser.mjs';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../../public/fonts/source-serif-06/manifest.json',import.meta.url)));
test('selected 06 renders roman listing decks, reader italics and bold authors without fallback',async({page})=>{
 await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));
 await page.goto('/articles/marnie-detroit-school');await page.evaluate(()=>document.fonts.ready);
 for(const f of Object.values(manifest.fonts)){
  const response=await page.request.get('/fonts/source-serif-06/'+f.file);expect(response.status()).toBe(200);expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(f.sha256);
 }
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root}=await cdp.send('DOM.getDocument');
 for(const [selector,style,weight,ps] of [['.articleBody p','normal','400','BriefBodyReference5-400'],['.articleDek','italic','400','BriefBodyReference5-Italic'],['.bylineWriter strong','normal','700','BriefBodyReference5-Bold']]){
  const el=page.locator(selector).first();await expect(el).toHaveCSS('font-family','"Brief Body Reference 5", serif');await expect(el).toHaveCSS('font-style',style);await expect(el).toHaveCSS('font-weight',weight);await expect(el).toHaveCSS('font-synthesis','none');
  const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});expect(fonts.filter(f=>f.glyphCount).map(f=>f.postScriptName)).toEqual([ps]);
 }
 // A labelled temporary glyph fixture exercises accents and punctuation in the real body face.
 await page.locator('.articleBody p').first().evaluate(e=>{const span=document.createElement('span');span.id='qa-glyphs';span.textContent='née — “élève” O’Connor';e.append(span)});
 await page.locator('#qa-glyphs').scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#qa-glyphs'});const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});expect(fonts.filter(f=>f.glyphCount).map(f=>f.postScriptName)).toEqual(['BriefBodyReference5-400']);await page.locator('#qa-glyphs').evaluate(e=>e.remove());
 await expect(page.locator('.articleTitle')).toHaveCSS('font-family','"Brief Nine F Native Preview", Georgia, serif');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 await page.screenshot({path:`/workspace/font-qa/selected-06-reader-${page.viewportSize().width}.png`});
 await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const category=page.locator('.sabinePackageIntro > small').first();await expect(category).toHaveCSS('color','rgb(100, 36, 28)');
 await expect(category).toHaveCSS('opacity','1');
 for(const deck of await page.locator('[data-editorial-system="a"] :is(.standfirst,.editorialDeck,.sabinePackageIntro > p,.cultureGrid .card > p)').all()){await expect(deck).toHaveCSS('font-style','normal');await expect(deck).toHaveCSS('font-family','"Brief Body Reference 5", serif');}
 for(const el of await page.locator('.mobileStoryRows .standfirst,.mobileStoryRows .sabinePackageIntro > p').all())if(page.viewportSize().width<=760){await expect(el).toHaveCSS('font-style','normal');await expect(el).toHaveCSS('font-size','14px');await expect(el).toHaveCSS('line-height','20px');}
 await page.screenshot({path:`/workspace/font-qa/selected-06-home-${page.viewportSize().width}.png`});
});
