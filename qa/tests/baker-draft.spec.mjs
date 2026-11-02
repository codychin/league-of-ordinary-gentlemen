import {test,expect} from '../helpers/browser.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const snapshot=readFileSync(new URL('../../drafts/baker-abstention-snapshot.md',import.meta.url),'utf8');
const plain=p=>p.replace(/\*([^*]+)\*/g,'$1').replace(/\[([^\]]+)\]\(https:\/\/[^)]+\)/g,'$1');
const paragraphs=snapshot.split('---',3)[2].trim().split('\n\n').map(plain);
const path='/articles/maude-baker-comparative-merits-of-abstention';

test('Baker preservation route retains exact approved copy and inline formatting',async({page})=>{
 expect(createHash('sha256').update(snapshot).digest('hex')).toBe('3b5b89384958ff874989f43b02c7c6ae25486ea44bbe2d91f02c766633641c07');
 expect(paragraphs).toHaveLength(27);
 expect((await page.goto(path)).status()).toBe(200);
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('h1')).toHaveText('Baker Mayfield and the Comparative Merits of Abstention');
 await expect(page.locator('.articleDek')).toHaveText('An afternoon that satisfied the league’s scheduling requirements.');
 await expect(page.locator('.bylineWriter strong')).toHaveText('By Maude Gannon');
 expect(await page.locator('.articleBody > p').allTextContents()).toEqual(paragraphs);
 await expect(page.locator('.articleBody em')).toHaveText('passer');
 await expect(page.getByRole('link',{name:'Scott Smith’s account for the Buccaneers'})).toHaveAttribute('href','https://www.buccaneers.com/news/falcons-bucs-week-8-recap-postgame-report-2026');
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
 await expect(page.locator('.eyebrow')).toHaveText('Unpublished draft');
 await expect(page.locator('h1')).toHaveCSS('font-family',/Brief Nine F Native Preview/);
 await expect(page.locator('.articleBody > p').first()).toHaveCSS('font-family',/Brief Body Reference 5/);
 await expect(page.locator('.articleDek')).toHaveCSS('font-style','italic');
 expect(await page.locator('main').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
 await expect(page.locator('.articleImage')).toHaveCount(0);
 for(const route of ['/','/archive']){
  await page.goto(route);
  await expect(page.locator(`a[href="${path}"]`)).toHaveCount(0);
 }
});
