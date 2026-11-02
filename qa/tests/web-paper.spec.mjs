import {test,expect} from '../helpers/browser.mjs';
for(const root of ['', '/doge', '/sunday-crew']){
 test(`${root||'Brief'} white web paper preserves inverse Culture at every width`,async({page})=>{
  await page.goto(root||'/');
  const desktop=page.viewportSize().width>=980;
  const paper='rgb(255, 255, 255)';
  await expect(page.locator('.immersiveLead')).toHaveCSS('background-color',paper);
  await expect(page.locator('#culture')).toHaveCSS('background-color','rgb(23, 22, 19)');
  await expect(page.locator('#culture')).toHaveCSS('color','rgb(245, 241, 232)');
  if(desktop){
   await expect(page.locator('body')).toHaveCSS('background-color',paper);
   await expect(page.locator('.siteNav')).toHaveCSS('background-color',paper);
   const fade=await page.locator('.immersiveLead .sundayFeatureImage').evaluate(e=>getComputedStyle(e,'::after').backgroundImage);
   expect(fade).toContain('255, 255, 255');expect(fade).not.toContain('245, 241, 232');
   const cream=await page.locator('main [data-editorial-system="a"]:not(#culture)').evaluateAll(es=>es.filter(e=>!e.closest('#culture')&&getComputedStyle(e).backgroundColor==='rgb(245, 241, 232)').length);
   expect(cream).toBe(0);
  }
 });
}

for(const root of ['', '/doge', '/sunday-crew']){
 test(`${root||'Brief'} standalone light paper and manifest agree without recoloring Culture`,async({page,request})=>{
  test.skip(page.viewportSize().width>760,'Standalone mobile surface');
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto(`${root||'/'}?app-preview=1`);
  await expect(page.locator('html')).toHaveClass(/standaloneApp/);
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content','#ffffff');
  const manifest=await (await request.get(root?`${root}/manifest.webmanifest`:'/manifest.webmanifest')).json();
  expect(manifest.background_color).toBe('#ffffff');expect(manifest.theme_color).toBe('#ffffff');
  const glider=await page.locator('.appTabGlider').evaluate(e=>getComputedStyle(e,'::after').backgroundColor);
  expect(glider).toBe('rgb(255, 255, 255)');
  const cream=await page.locator('body *').evaluateAll(es=>es.filter(e=>{const b=e.getBoundingClientRect();return b.width>200&&b.height>30&&!e.closest('#culture')&&['rgb(245, 241, 232)','rgb(243, 239, 229)'].includes(getComputedStyle(e).backgroundColor)}).map(e=>e.className));
  expect(cream).toEqual([]);
  await page.goto(`${root||'/'}?app-preview=1&tab=culture`);
  await expect(page.locator('#culture')).toBeVisible();
  await expect(page.locator('#culture')).toHaveCSS('background-color','rgb(23, 22, 19)');
  await expect(page.locator('#culture')).toHaveCSS('color','rgb(245, 241, 232)');
  await page.route('**/functions/v1/brief-comments?*',r=>r.fulfill({json:{comments:[],votes:[]}}));
  for(const path of [`${root}/archive`,`${root}/articles/marnie-detroit-school`]){
   await page.goto(path);
   await expect(page.locator('main')).toHaveCSS('background-color','rgb(255, 255, 255)');
   await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  }
 });
}
