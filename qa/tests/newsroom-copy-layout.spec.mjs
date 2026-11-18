import {test,expect} from '../helpers/browser.mjs';
import {readFileSync} from 'node:fs';
const source=readFileSync('app/articles/newsroom-ai-apology.js','utf8');
const article=JSON.parse(source.replace(/^export const newsroomApologyArticle\s*=\s*/,'').replace(/;\s*$/,''));
for(const root of ['', '/doge','/sunday-crew'])for(const scheme of ['light','dark']){
 test('current newsroom copy remains readable '+(root||'global')+' '+scheme,async({page},testInfo)=>{
  await page.emulateMedia({colorScheme:scheme,reducedMotion:'reduce'});
  await page.goto(root+'/articles/newsroom-ai-apology');
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.articleTitle')).toHaveText(article.title);
  await expect(page.locator('.articleDek')).toHaveText(article.dek);
  const paragraphs=page.locator('.articleBody > p');
  await expect(paragraphs).toHaveText(article.body.filter(b=>typeof b==='string'));
  const title=await page.locator('.articleTitle').boundingBox(),dek=await page.locator('.articleDek').boundingBox();
  expect(dek.y).toBeGreaterThanOrEqual(title.y+title.height-1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const signatures=page.getByLabel('Signed by the newsroom');
  await signatures.scrollIntoViewIfNeeded();
  const expected=article.body.find(b=>b.type==='signatures').signatures;
  await expect(signatures.locator('img')).toHaveCount(expected.length);
  for(const signature of expected){
    const image=signatures.getByAltText(signature.name,{exact:true});
    await expect.poll(()=>image.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
    const box=await image.boundingBox();expect(box.width).toBeGreaterThan(20);expect(box.width).toBeLessThanOrEqual(signature.maxWidth+1);expect(box.height).toBeLessThanOrEqual(111);
  }
  await paragraphs.last().scrollIntoViewIfNeeded();
  await expect(paragraphs.last()).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('article-signoff.png')});
 });
}
