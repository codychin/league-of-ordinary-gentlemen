import {test,expect} from '@playwright/test';
for(const slug of ['maude-nfc-east-declines-winner','marnie-marvin-harrison-somewhere-else']){
 test(`article hero preserves image geometry: ${slug}`,async({page})=>{
  const response=await page.goto(`/articles/${slug}`);expect(response?.status()).toBe(200);
  const img=page.locator('main img.articleImage').first();await expect(img).toBeVisible();
  await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  const g=await img.evaluate(i=>{const r=i.getBoundingClientRect();return {ratio:r.width/r.height,natural:i.naturalWidth/i.naturalHeight,fit:getComputedStyle(i).objectFit}});
  expect(Math.abs(g.ratio/g.natural-1)).toBeLessThan(.025);expect(g.fit).not.toBe('cover');
 });
}
