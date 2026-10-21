import {test,expect} from '@playwright/test';

// Catch scorecard portraits that float across the Matchup divider.
// The CSS image box must finish at the portrait row's lower boundary.
for(const path of ['/','/sunday-crew','/doge']){
  test(`scorecard portraits rest on baseline: ${path}`, async({page})=>{
    await page.goto(path);
    const card=page.locator('.briefMatchupCard').first();
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();
    const row=card.locator('.briefMatchupPortraits');
    const photos=row.locator('img');
    await expect(photos.first()).toBeVisible();
    const geometry=await row.evaluate(el=>{
      const bottom=el.getBoundingClientRect().bottom;
      return [...el.querySelectorAll('img')].map(img=>({
        offset: Math.round((img.getBoundingClientRect().bottom-bottom)*100)/100,
        position:getComputedStyle(img).position,
        top:getComputedStyle(img).top
      }));
    });
    expect(geometry.length).toBeGreaterThan(0);
    for(const img of geometry){
      expect(Math.abs(img.offset),JSON.stringify(img)).toBeLessThanOrEqual(1);
    }
  });
}
