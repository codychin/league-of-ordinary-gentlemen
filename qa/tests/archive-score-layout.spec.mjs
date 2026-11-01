import {test,expect} from '../helpers/browser.mjs';
test('archived Week 2 score notes do not overlap teams or displace their shared baseline',async({page})=>{
 if(page.viewportSize().width>760)await page.setViewportSize({width:1261,height:900});
 await page.goto('/');const section=page.locator('.scoreSection').filter({has:page.getByRole('heading',{name:'Week 2 Final',exact:true})});await section.scrollIntoViewIfNeeded();
 const cards=section.locator('.archiveScores > .match');await expect(cards).toHaveCount(6);
 await expect(cards.nth(0).locator('strong')).toHaveText(['150.07','140.21']);await expect(cards.nth(5).locator('strong')).toHaveText(['161.22','126.63']);
 const y=[];
 for(const card of await cards.all()){
  const team=card.locator(':scope > div').first(),box=await team.boundingBox();y.push(box.y);
  const note=card.locator('.scoreNote');if(await note.count()){await expect(note).toHaveCSS('position','static');const n=await note.boundingBox();expect(box.y-n.y-n.height).toBeGreaterThanOrEqual(6);}
  expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 }
 if(page.viewportSize().width>760){expect(y[0]).toBeCloseTo(y[1],0);expect(y[1]).toBeCloseTo(y[2],0);expect(y[3]).toBeCloseTo(y[4],0);expect(y[4]).toBeCloseTo(y[5],0);}
 await section.screenshot({path:`/workspace/font-qa/archive-week2-${page.viewportSize().width}.png`});
 await expect(page.locator('#scores-week3 .archiveScores > .match')).toHaveCount(6);
});
