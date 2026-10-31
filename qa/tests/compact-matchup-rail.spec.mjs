import fs from 'node:fs';
import {test,expect} from '../helpers/browser.mjs';
import {writers} from '../../app/articles/writers.js';
const media=JSON.parse(fs.readFileSync(new URL('../../data/week8-approved-homepage-media.json',import.meta.url)));
for(const edition of ['loog','doge','sunday-crew']){
 test(`${edition} compact rail preserves all six pairings and viewer navigation`,async({page})=>{
  // Readiness and playback requests are explicit fixtures; controls and publication data are real.
  await page.route('**/reels-hls/**',r=>r.request().method()==='HEAD'?r.fulfill({status:200,body:''}):r.abort());
  await page.goto(edition==='loog'?'/':`/${edition}`);
  const shelf=page.getByRole('region',{name:'Week 8, the previews. videos',exact:true});
  const cards=shelf.getByRole('button',{name:/^Watch /});await expect(cards).toHaveCount(6);await page.evaluate(()=>document.fonts.ready);
  const rows=media.filter(r=>r.edition===edition);
  expect(await cards.evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')))).toEqual(rows.map(r=>`Watch ${r.matchup} by ${writers[r.writer].name}`));
  for(let i=0;i<6;i++){
   await expect(cards.nth(i)).toContainText(rows[i].short);
   const b=await cards.nth(i).boundingBox();expect(b.height).toBeGreaterThanOrEqual(44);expect(b.height).toBeLessThanOrEqual(160);expect(b.width).toBeGreaterThanOrEqual(94);
  }
  await expect(page.locator('section[aria-label$=" videos"]')).toHaveCount(1);
  const first=await cards.first().boundingBox(),second=await cards.nth(1).boundingBox(),heading=await shelf.locator('h2').boundingBox(),hero=await page.locator('.immersiveLead').boundingBox();
  expect(first.height).toBeCloseTo(133,0);const photo=cards.first().locator(':scope > span').first();expect((await photo.boundingBox()).height).toBeCloseTo(88,0);await expect(photo.locator('img')).not.toHaveCount(0);await expect(photo).toHaveCSS('outline-style','none');await expect(photo).toHaveCSS('box-shadow','none');expect(second.x-first.x-first.width).toBeCloseTo(8,0);expect(first.y-heading.y-heading.height).toBeCloseTo(8,0);expect(hero.y-first.y-first.height).toBeCloseTo(8,0);
  if(page.viewportSize().width<=760){const rail=cards.first().locator('..');expect(await rail.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);await rail.hover();await page.mouse.wheel(220,0);await expect.poll(()=>rail.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);}

  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await cards.first().scrollIntoViewIfNeeded();await cards.first().focus();
  const before=await cards.first().boundingBox();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label',`${rows[0].matchup} video preview`);
  await page.getByRole('button',{name:'Next reel',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label',`${rows[1].matchup} video preview`);
  await page.keyboard.press('ArrowLeft');await expect(page.getByRole('dialog')).toHaveAttribute('aria-label',`${rows[0].matchup} video preview`);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async()=>Math.abs((await cards.first().boundingBox()).y-before.y)).toBeLessThan(2);
  await cards.last().focus();await expect(cards.last()).toBeFocused();
  await cards.first().focus();await shelf.screenshot({path:`/workspace/font-qa/compact-rail-${edition}-${page.viewportSize().width}.png`});
 });
}
