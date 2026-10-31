import fs from 'node:fs';
import {test,expect} from '../helpers/browser.mjs';
import {writers} from '../../app/articles/writers.js';
const media=JSON.parse(fs.readFileSync(new URL('../../data/week8-approved-homepage-media.json',import.meta.url)));
for(const edition of ['loog','doge','sunday-crew']){
 test(`${edition} compact rail preserves all six pairings and viewer navigation`,async({page})=>{
  // Readiness and playback requests are explicit fixtures; controls and publication data are real.
  await page.route('https://a.espncdn.com/**',r=>r.abort());
  await page.route('**/reels-hls/**',r=>r.request().method()==='HEAD'?r.fulfill({status:200,body:''}):r.abort());
  await page.goto(edition==='loog'?'/':`/${edition}`);
  const shelf=page.getByRole('region',{name:'Week 8, the previews. videos',exact:true});
  const cards=shelf.getByRole('button',{name:/^Watch /});await expect(cards).toHaveCount(6);await page.evaluate(()=>document.fonts.ready);
  const rows=media.filter(r=>r.edition===edition);const desktop=page.viewportSize().width>760;
  expect(await cards.evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')))).toEqual(rows.map(r=>`Watch ${r.matchup} by ${writers[r.writer].name}`));
  for(let i=0;i<6;i++){
   await expect(cards.nth(i)).toContainText(rows[i].short);await expect(cards.nth(i)).toHaveAccessibleDescription('Not opened');
   const b=await cards.nth(i).boundingBox();expect(b.height).toBeGreaterThanOrEqual(44);expect(b.height).toBeLessThanOrEqual(160);expect(b.width).toBeGreaterThanOrEqual(94);
  }
  await expect(page.locator('section[aria-label$=" videos"]')).toHaveCount(1);
  const first=await cards.first().boundingBox(),second=await cards.nth(1).boundingBox(),heading=await shelf.locator('h2').boundingBox(),hero=await page.locator('.immersiveLead').boundingBox();
  expect(first.height).toBeCloseTo(desktop?157:133,0);const photo=cards.first().locator(':scope > span').first();expect((await photo.boundingBox()).height).toBeCloseTo(desktop?112:88,0);await expect(photo.locator('img')).not.toHaveCount(0);await expect(photo).toHaveCSS('outline-width','2px');await expect(photo).toHaveCSS('outline-color','rgb(164, 61, 49)');await expect(cards.first()).toHaveAccessibleDescription('Not opened');await expect(photo).toHaveCSS('box-shadow','none');expect(second.x-first.x-first.width).toBeCloseTo(desktop?12:8,0);expect(first.y-heading.y-heading.height).toBeCloseTo(8,0);expect(hero.y-first.y-first.height).toBeCloseTo(8,0);
  if(desktop){const last=await cards.last().boundingBox(),railBox=await cards.first().locator('..').boundingBox();expect(last.x+last.width-first.x).toBeCloseTo(railBox.width,0);expect(last.width).toBeCloseTo(first.width,0);expect(first.width).toBeGreaterThan(156);}
  if(page.viewportSize().width<=760){const rail=cards.first().locator('..');expect(await rail.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);await rail.hover();await page.mouse.wheel(220,0);await expect.poll(()=>rail.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);}

  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await cards.first().scrollIntoViewIfNeeded();await cards.first().focus();
  const before=await cards.first().boundingBox();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label',`${rows[0].matchup} video preview`);
  await page.getByRole('button',{name:'Next reel',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label',`${rows[1].matchup} video preview`);
  // Simulate completion to verify the existing auto-advance rule, not actual media playback.
  await page.getByRole('dialog').locator('video').last().dispatchEvent('ended');
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label',`${rows[2].matchup} video preview`);
  await page.keyboard.press('ArrowLeft');

  await page.keyboard.press('ArrowLeft');await expect(page.getByRole('dialog')).toHaveAttribute('aria-label',`${rows[0].matchup} video preview`);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async()=>Math.abs((await cards.first().boundingBox()).y-before.y)).toBeLessThan(2);
  const key=`brief-${edition}-week8-preview-viewed-v2`;
  await expect.poll(()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),key)).toEqual(Object.fromEntries(rows.slice(0,3).map(r=>[r.id,true])));
  await page.reload();await expect(cards).toHaveCount(6);
  for(let i=0;i<6;i++)await expect(cards.nth(i)).toHaveAccessibleDescription(i<3?'Opened':'Not opened');
  await expect(photo).toHaveCSS('outline-width','1px');await expect(photo).toHaveCSS('opacity','0.72');
  for(let i=3;i<6;i++){await cards.nth(i).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close video',exact:true}).click();}
  await expect.poll(()=>page.evaluate(k=>Object.keys(JSON.parse(localStorage.getItem(k)||'{}')).length,key)).toBe(6);
  for(const other of ['loog','doge','sunday-crew'].filter(e=>e!==edition))expect(await page.evaluate(k=>localStorage.getItem(k),`brief-${other}-week8-preview-viewed-v2`)).toBeNull();
  await cards.last().focus();await expect(cards.last()).toBeFocused();
  await cards.first().focus();await shelf.screenshot({path:`/workspace/font-qa/compact-rail-${edition}-${page.viewportSize().width}.png`});
 });
}
