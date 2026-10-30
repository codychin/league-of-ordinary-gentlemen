import {test,expect} from '@playwright/test';
const retired=[
 ['hollis-jameis-winston-turing-test','The Jameis Winston Turing Test'],
 ['conrad-deshaun-watson-cleveland-hope','Groper Cleveland Is 3–1'],
];
for(const root of ['','/sunday-crew','/doge']){
 test(`homepage CTA and retained archive articles: ${root||'LOOG'}`,async({page},testInfo)=>{
  await page.route('**/functions/v1/brief-comments?**',route=>route.fulfill({json:{comments:[],votes:[]}}));
  await page.route('**/api/article-reactions**',route=>route.fulfill({json:{counts:{up:0,wtf:0,middle:0}}}));
  await page.goto(root||'/',{waitUntil:'domcontentloaded'});
  const lead=page.getByRole('region',{name:'Lead story: A Study in Movement: The Detroit School, 2026',exact:true});
  const cta=lead.getByRole('link',{name:'READ MARNIE →',exact:true});
  const recent=page.getByRole('region',{name:'Recent stories',exact:true});
  await expect(cta).toHaveAttribute('href',`${root}/articles/marnie-detroit-school`);
  const style=el=>{const s=getComputedStyle(el);return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,color:s.color,spacing:s.letterSpacing}};
  expect(await cta.evaluate(style)).toEqual(await recent.locator('.read').first().evaluate(style));
  await expect(recent.locator(':scope > article')).toHaveCount(3);
  expect(await recent.locator(':scope > article > a').evaluateAll(els=>els.map(el=>el.getAttribute('href')))).toEqual(['maude-saturation-bombing-daniel-jones','conrad-allow-me-to-reintroduce-myself','marnie-delicate-etiquette-sporting-pat'].map(slug=>`${root}/articles/${slug}`));
  for(const [slug] of retired)await expect(page.locator(`main a[href="${root}/articles/${slug}"]`)).toHaveCount(0);
  await cta.scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('local-QA-fixture-league-data-homepage.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto(`${root}/archive`,{waitUntil:'domcontentloaded'});
  for(const [slug,title] of retired){
   const story=page.locator(`.archiveStory[href="${root}/articles/${slug}"]`);
   await expect(story).toContainText(title);
  }
  await page.locator(`.archiveStory[href="${root}/articles/${retired[0][0]}"]`).scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('local-QA-fixture-league-data-archive.png')});
  for(const [slug,title] of retired){
   await page.goto(`${root}/articles/${slug}`,{waitUntil:'domcontentloaded'});
   await expect(page.getByRole('heading',{level:1,name:title,exact:true})).toBeVisible();
   expect(await page.locator('.articleBody').innerText()).not.toBe('');
  }
 });
}
