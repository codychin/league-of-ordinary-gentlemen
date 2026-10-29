import {test,expect} from '@playwright/test';
const article='/articles/maude-saturation-bombing-daniel-jones';
const enabled=process.env.QA_ANALYTICS_ENABLED==='1';

// Exercise the real SDK and Next routing with a local intake double. No Vercel
// collection or third-party requests occur. Live intake is a post-activation check.
async function intercept(context) {
  await context.route('**/*', async route=> {
    const url=new URL(route.request().url());
    if (url.pathname==='/_vercel/insights/script.js') return route.fulfill({contentType:'text/javascript',body:`
      window.analyticsViews=[];
      let beforeSend=e=>e;
      window.va=function(command, value){
        if(command==='beforeSend') beforeSend=value;
        if(command==='pageview') {
          const event=beforeSend({type:'pageview',url:new URL(value.path,location.origin).href});
          if(event) window.analyticsViews.push({...event,route:value.route});
        }
      };
      (window.vaq||[]).forEach(args=>window.va(...args));
    `});
    if (!['localhost','127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}
const views=page=>page.evaluate(()=>window.analyticsViews||[]);

test('production has one pageview per SPA navigation, URL-specific article routes, no query/hash duplicates', async({page,context})=>{
  await intercept(context);
  await page.goto('/');
  if(!enabled){
    await page.goto('/analytics-preferences');
    await expect(page.getByRole('status')).toContainText('not excluded');
    await page.getByRole('link',{name:'Return to The Brief'}).click();
    await expect(page).toHaveURL(process.env.QA_BASE_URL+'/');
    await expect(page.locator('script[src*="/_vercel/insights/"]')).toHaveCount(0);
    expect(await views(page)).toEqual([]);
    return;
  }
  await expect.poll(()=>views(page)).toHaveLength(1);
  await expect(page.locator('script[src="/_vercel/insights/script.js"]')).toHaveAttribute('data-disable-auto-track','1');
  await page.locator(`a[href="${article}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(article+'$'));
  await expect.poll(()=>views(page)).toHaveLength(2);
  expect((await views(page))[1].route).toBe(article);
  await page.evaluate(()=>{history.pushState({},'',location.pathname+'?secret=hidden#section');});
  await page.waitForTimeout(400);
  expect(await views(page)).toHaveLength(2);
  await page.goBack();
  await page.goBack();
  await expect.poll(()=>views(page)).toHaveLength(3);
  expect((await views(page)).map(e=>new URL(e.url).pathname)).toEqual(['/',article,'/']);
});

test('each browser context opts out independently; stored preference survives reload and SPA navigation', async({browser})=>{
  test.skip(!enabled,'Production simulation only');
  const contexts=[];
  try {
    for(let i=0;i<3;i++) {
      const context=await browser.newContext({baseURL:process.env.QA_BASE_URL,serviceWorkers:'block',...(i===2?{viewport:{width:390,height:844},isMobile:true}: {})});
      contexts.push(context); await intercept(context);
      const page=await context.newPage();
      await page.goto('/analytics-preferences');
      await expect(page.getByRole('status')).toContainText('not excluded');
      expect(await views(page)).toEqual([]);
      await page.getByRole('button',{name:'Exclude this browser',exact:true}).click();
      await expect(page.getByRole('status')).toContainText('is excluded');
      await page.getByRole('link',{name:'Return to The Brief'}).click();
      await page.locator(`a[href="${article}"]`).first().click();
      expect(await views(page)).toEqual([]);
      await page.reload();
      expect(await views(page)).toEqual([]);
      // Another tab sees the same origin's browser-local opt-out.
      const tab=await context.newPage(); await tab.goto('/');
      expect(await views(tab)).toEqual([]);
    }
    const page=await contexts[0].newPage(); await page.goto('/analytics-preferences');
    await page.getByRole('button',{name:'Allow pageview analytics in this browser'}).click();
    await page.getByRole('link',{name:'Return to The Brief'}).click();
    await expect.poll(()=>views(page)).toHaveLength(1);
    for(const context of contexts.slice(1)) {
      const page=await context.newPage(); await page.goto('/'); expect(await views(page)).toEqual([]);
    }
  } finally {await Promise.all(contexts.map(c=>c.close()));}
});

test('all edition homepages and article URLs remain separate', async({page,context})=>{
  test.skip(!enabled,'Production simulation only');
  test.skip(process.env.QA_EDITION_DATA_READY !== '1', 'Edition homepages require reachable existing data service');
  await intercept(context);
  for(const root of ['', '/sunday-crew', '/doge']) {
    await page.goto(root || '/');
    await expect.poll(()=>views(page)).toHaveLength(1);
    const target=root+article;
    await page.locator(`a[href="${target}"]`).first().click();
    await expect.poll(()=>views(page)).toHaveLength(2);
    expect((await views(page)).map(e=>e.route)).toEqual([root || '/',target]);
  }
});
