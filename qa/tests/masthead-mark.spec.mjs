import {test,expect} from '../helpers/browser.mjs';
test('all edition mastheads show the brand mark with a compact content gap',async({page})=>{
 test.skip(page.viewportSize().width>760,'Mobile masthead contract');
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 for(const root of ['/','/doge','/sunday-crew'])for(const standalone of [false,true]){
  await page.goto(root+(standalone?'?app-preview=1':''));
  await expect(page.locator('html')).toHaveAttribute('data-app-tab','home');
  await page.evaluate(()=>document.fonts.ready);
  const logo=page.getByRole('link',{name:'The Brief home',exact:true}),mark=logo.locator('img');
  await expect(mark).toBeVisible();
  await expect(page.locator('.appSectionHeader')).toHaveCSS('background-image','none');
  await expect(page.locator('.appSectionHeader')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect.poll(()=>mark.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  await expect(mark).toHaveAttribute('src','/icons/ordinary-brief-masthead.svg');
  const heading=page.getByRole('region',{name:/videos$/}).first().locator('h2');await expect(heading).toBeVisible();await expect(heading).toHaveCSS('font-size','18px');await expect(heading).toHaveCSS('line-height','24px');
  const geometry=await logo.evaluate(e=>{const r=n=>n.getBoundingClientRect(),i=e.querySelector('img'),words=e.querySelectorAll('b'),heading=document.querySelector('[aria-label$="videos"] h2');return{width:r(i).width,height:r(i).height,leftGap:r(i).left-r(words[0]).right,rightGap:r(words[1]).left-r(i).right,tapHeight:r(e).height,contentGap:r(heading).top-r(words[0]).bottom,font:getComputedStyle(words[0]).fontFamily}});
  expect(geometry.width).toBe(30);expect(geometry.height).toBe(30);expect(geometry.leftGap).toBeCloseTo(8,0);expect(geometry.rightGap).toBeCloseTo(8,0);expect(geometry.tapHeight).toBeGreaterThanOrEqual(44);expect(geometry.contentGap).toBeCloseTo(24,0);expect(geometry.font).toContain('Brief Nine F Native Preview');
  await page.screenshot({path:`/workspace/font-qa/mark-${root==='/'?'loog':root.slice(1)}-${standalone}-${page.viewportSize().width}.png`});
  await page.evaluate(()=>scrollTo(0,300));await expect(mark).toBeInViewport();
 }
});
test('desktop weekly heading stays at section-label scale with all six previews',async({page})=>{
 test.skip(page.viewportSize().width<=760,'Desktop shelf scale');
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 for(const root of ['/','/doge','/sunday-crew']){
  await page.goto(root);await page.evaluate(()=>document.fonts.ready);
  const shelf=page.getByRole('region',{name:/videos$/}).first();
  await expect(shelf.locator('h2')).toHaveCSS('font-size','20px');await expect(shelf.locator('h2')).toHaveCSS('line-height','26px');
  await expect(shelf.getByRole('button',{name:/^Watch /})).toHaveCount(6);
  await page.screenshot({path:`/workspace/font-qa/mark-desktop-${root==='/'?'loog':root.slice(1)}.png`});
 }
});
