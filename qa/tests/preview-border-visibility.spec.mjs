import sharp from 'sharp';
import {test,expect} from '../helpers/browser.mjs';

for(const root of ['','/doge','/sunday-crew'])for(const standalone of [false,true]){
 test(`preview perimeter remains visible ${root||'Brief'} ${standalone?'standalone':'browser'}`,async({page},testInfo)=>{
  test.skip(standalone&&page.viewportSize().width>760,'Standalone mobile only');
  if(standalone)await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/reels-hls/**',r=>r.request().method()==='HEAD'?r.fulfill({status:200,body:''}):r.abort());
  await page.goto(root||'/');
  const shelf=page.getByRole('region',{name:'Week 8, the previews. videos',exact:true});
  const cards=shelf.getByRole('button',{name:/^Watch /});
  await expect(cards).toHaveCount(6);await page.evaluate(()=>document.fonts.ready);
  for(const index of [0,2,5]){
   const card=cards.nth(index),thumb=card.locator(':scope > span').first();
   await card.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'nearest',inline:'start'}));
   await expect.poll(()=>thumb.evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth}),'sampled card is fully inside the viewport').toBe(true);
   await expect(card).toHaveAccessibleDescription('Not opened');
   const box=await thumb.boundingBox();
   const png=await page.screenshot({scale:'css',path:testInfo.outputPath(`card-${index}.png`)});
   const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
   // Sample the actual rendered perimeter, not just the computed outline.
   // This fails when the rail clips the first/last outer edge.
   const points=[[box.x+1,box.y+box.height/2],[box.x+box.width-1,box.y+box.height/2],[box.x+box.width/2,box.y+1],[box.x+box.width/2,box.y+box.height-1]];
   for(const [x,y] of points){
    expect(x).toBeGreaterThanOrEqual(0);expect(x).toBeLessThan(info.width);
    expect(y).toBeGreaterThanOrEqual(0);expect(y).toBeLessThan(info.height);
    const p=(Math.floor(y)*info.width+Math.floor(x))*info.channels;
    expect([...data.subarray(p,p+3)],`card ${index} visible border at ${x},${y}`).toEqual([164,61,49]);
   }
  }
  await cards.last().click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Close video',exact:true}).click();
  await expect(cards.last()).toHaveAccessibleDescription('Opened');
  const seen=cards.last().locator(':scope > span').first();
  expect(await seen.evaluate(e=>{const s=getComputedStyle(e,'::after');return [s.borderTopWidth,s.boxSizing,s.pointerEvents]})).toEqual(['1px','border-box','none']);
  await expect(seen).toHaveCSS('opacity','0.72');
 });
}
