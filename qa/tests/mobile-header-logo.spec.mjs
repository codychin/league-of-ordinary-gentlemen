import {test,expect} from '../helpers/browser.mjs';
test('floating text logo stays visible across browser and installed-web navigation',async({page})=>{
 test.skip(page.viewportSize().width>760,'Mobile header only');
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));
 const check=async()=>{
  const logo=page.getByRole('link',{name:'The Brief home',exact:true}),header=page.locator('.appSectionHeader');
  await expect(logo).toBeVisible();await expect(logo).toHaveCSS('color','rgb(38, 36, 31)');
  await expect(header).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(header).toHaveCSS('border-bottom-width','0px');await expect(header).toHaveCSS('position','fixed');
  const bounds=await logo.boundingBox();expect(bounds.height).toBeGreaterThanOrEqual(44);expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(await logo.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})).toBe(true);
  await expect(logo.locator('img')).toBeHidden();await expect(page.getByRole('navigation',{name:'App navigation'})).toHaveCount(1);
  expect(await header.evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('0.64');
 };
 for(const mode of ['', '?app-preview=1']){
  await page.goto('/'+mode);await page.evaluate(()=>document.fonts.ready);await check();
  await page.mouse.wheel(0,300);await page.waitForTimeout(150);await check();
  await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Culture',exact:true}).click();await expect(page.locator('#culture')).toBeVisible();await check();
  await page.screenshot({path:`/workspace/font-qa/header-culture-${mode?'installed':'browser'}-${page.viewportSize().width}.png`});
  await page.goto('/articles/marnie-detroit-school'+mode);await page.evaluate(()=>document.fonts.ready);await check();
  await page.mouse.wheel(0,350);await page.waitForTimeout(150);await check();
  await page.goto('/archive'+mode);await check();
  await page.getByRole('link',{name:'The Brief home',exact:true}).click();await expect(page).toHaveURL(/\/$/);await check();
 }
 await page.goto('/?app-preview=1');await page.evaluate(()=>document.fonts.ready);
 await page.locator('main[data-weekly-media]').evaluate(e=>{e.dataset.weeklyMedia='absent';while(e.firstElementChild&&!e.firstElementChild.matches('.immersiveLead'))e.firstElementChild.remove();});
 await check();expect((await page.locator('.immersiveLead .sundayFeatureImage').boundingBox()).y).toBeCloseTo(0,0);
 await page.screenshot({path:`/workspace/font-qa/header-no-strip-${page.viewportSize().width}.png`});
});
