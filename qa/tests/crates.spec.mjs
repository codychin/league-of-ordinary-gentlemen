import {test,expect} from '../helpers/browser.mjs';

for(const root of ['', '/sunday-crew', '/doge']){
  test(`The Crates ${root||'main'} preserves routes and supports discovery`,async({page},testInfo)=>{
    await page.goto(`${root}/archive`);
    await expect(page.getByRole('heading',{name:'The Crates.'})).toBeVisible();
    const search=page.getByRole('searchbox',{name:'Search the Crates'});
    await search.fill('White Coaches');
    await expect(page.getByRole('status')).toHaveText(root==='/doge'?/^1 story/:/^0 stories/);
    if(root==='/doge')await expect(page.locator('main a[href="/doge/articles/conrad-white-coaches-lose-individually"] img')).toBeVisible();
    await search.fill('corgi');
    await expect(page.getByRole('status')).toHaveText(/^1 story\s+\/ All shelves$/);
    await expect(page.locator('main a[href$="/articles/marnie-corgi-he-wanted-them-to-know"]').last()).toHaveAttribute('href',`${root}/articles/marnie-corgi-he-wanted-them-to-know`);
    await search.fill('no-story-matches-this-query');
    await expect(page.getByRole('heading',{name:'Nothing in this crate yet.'})).toBeVisible();
    await page.getByRole('button',{name:'Clear filters'}).first().click();
    await page.getByRole('button',{name:'Money & Power',exact:true}).click();
    await page.getByLabel('By correspondent').selectOption('Marnie Kells');
    await expect(page.getByRole('status')).toHaveText(/^0 stories/);
    await page.getByRole('button',{name:'Clear filters'}).first().click();
    await page.getByLabel('Order',{exact:true}).selectOption('oldest');
    const grid=page.locator('main [class*="grid"]');
    const dates=await grid.locator('time').evaluateAll(xs=>xs.map(x=>Date.parse(x.dateTime)));
    expect(dates).toEqual([...dates].sort((a,b)=>a-b));
    await page.getByLabel('Order',{exact:true}).selectOption('newest');
    await page.getByRole('button',{name:'Keep digging'}).click();
    await expect(grid.locator(':scope > a')).toHaveCount(18);
    await expect(grid.locator(':scope > a').nth(9)).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const link of await grid.locator(':scope > a').all())expect(await link.getAttribute('href')).toMatch(new RegExp(`^${root}/articles/`));
    if(testInfo.project.name.startsWith('mobile'))await expect(page.locator('.siteNav')).toBeHidden();
  });
  test(`The Crates ${root||'main'} uses the existing mobile app shell`,async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto(`${root}/archive?app-preview=1`);
    await expect(page.getByRole('heading',{name:'The Crates.'})).toBeVisible();
    await expect(page.locator('.siteNav')).toBeHidden();
    await expect(page.locator('.appTabBar')).toHaveCount(1);
    await page.getByRole('button',{name:'More',exact:true}).click();
    await expect(page.locator('.appMoreLinks').getByRole('link',{name:'The Crates'})).toHaveAttribute('href',`${root}/archive`);
  });
}

test('global Crates excludes local stories across every page and restores existing card images',async({page})=>{
  await page.goto('/archive');
  await expect(page.getByRole('status')).toHaveText(/^39 stories/);
  while(await page.getByRole('button',{name:'Keep digging'}).count())await page.getByRole('button',{name:'Keep digging'}).click();
  const cards=page.locator('main [class*="grid"] > a');
  await expect(cards).toHaveCount(39);
  const hrefs=await cards.evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));
  expect(hrefs).not.toContain('/articles/conrad-white-coaches-lose-individually');
  expect(hrefs).not.toContain('/articles/marnie-paying-retail');
  expect(hrefs).not.toContain('/articles/maude-jayden-daniels-elbow');
  for(const slug of ['marnie-cruise-swift-football']){
    const img=page.locator(`main a[href="/articles/${slug}"] img`);
    await img.scrollIntoViewIfNeeded();
    await expect(img).toBeVisible();
    await expect.poll(()=>img.evaluate(x=>x.complete&&x.naturalWidth>0)).toBe(true);
  }
  const textCard=page.locator('main a[href="/articles/marnie-tee-higgins-ankles"]');
  await expect(textCard).toHaveClass(/textStory/);
  await expect(textCard.locator('img')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
