import {test,expect} from '../helpers/browser.mjs';

test('preview widths, row boundary and dispatch ownership survive standalone rendering',async({page},testInfo)=>{
 for(const root of ['/','/doge','/sunday-crew']){
  await page.goto(`${root}?app-preview=1`);
  await expect(page.locator('html')).toHaveClass(/standaloneApp/);
  const cards=page.locator('[data-matchup-layout="compact"] button[aria-label^="Watch"]');
  await expect(cards).toHaveCount(6);
  const widths=await cards.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width));
  expect(Math.max(...widths)-Math.min(...widths)).toBeLessThan(1);
  const geometry=await cards.evaluateAll(nodes=>nodes.map(n=>({top:n.firstElementChild.getBoundingClientRect().top,overflow:n.scrollWidth>n.clientWidth+1})));
  expect(Math.max(...geometry.map(x=>x.top))-Math.min(...geometry.map(x=>x.top))).toBeLessThan(1);
  expect(geometry.some(x=>x.overflow)).toBe(false);
  const rows=page.locator('.mobileStoryRows');
  const first=rows.locator(':scope > section').first();
  expect(await first.locator('a[href*="marnie-hecklinski-use-your-words"]').count()).toBeGreaterThan(0);
  expect(await first.evaluate(e=>parseFloat(getComputedStyle(e,'::before').height))).toBeGreaterThanOrEqual(1);
  const dispatch=rows.locator('section').filter({has:page.locator('video')});
  await expect(dispatch.locator('a[href*="dashiell-jaguars-london-future"]').first()).toBeVisible();
  await expect(dispatch.locator('video')).toHaveAttribute('src',/cgt-20261008002242/);
  const cta=page.getByRole('link',{name:'DIG INTO THE CRATES',exact:true});
  await expect(cta).toBeVisible();
  expect(await cta.innerText()).not.toContain('→');
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath(`${root==='/'?'brief':root.slice(1)}-rows.png`)});
 }
});

test('published bureau entries have context, intact links and visible league content',async({page},testInfo)=>{
 for(const root of ['/doge','/sunday-crew']){
  await page.goto(`${root}?app-preview=1`);
  const bureau=page.locator('section[aria-label$=" bureau"]');
  // Runs against actual published payloads or a fixture with body and null dek.
  if(!await bureau.count()){test.skip(true,'Target fixture has no published bureau articles');return;}
  const stories=bureau.locator('article');
  expect(await stories.count()).toBeGreaterThan(0);
  for(const story of await stories.all()){
   await expect(story.locator('p')).not.toHaveText('');
   await expect(story.locator('h3 a')).toHaveAttribute('href',new RegExp(`^${root}/articles/`));
  }
  await expect(page.locator('.autopsyLead > p')).toBeVisible();
  await expect(page.locator('.standingsTable tbody tr')).toHaveCount(12);
  await expect(page.locator('.decisionDesk')).toBeVisible();
  await bureau.scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath(`${root.slice(1)}-bureau.png`)});
  await page.screenshot({path:testInfo.outputPath(`${root.slice(1)}-full.png`),fullPage:true});
 }
});
