import {test,expect} from '../helpers/browser.mjs';
test('Crates mobile title, intro and section label have independent rows',async({page},testInfo)=>{
 test.skip(page.viewportSize().width>760,'Mobile layout only');
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 for(const width of [320,375,420])for(const root of ['','/doge','/sunday-crew'])for(const standalone of [false,true]){
  await page.setViewportSize({width,height:844});
  await page.goto(root+'/archive'+(standalone?'?app-preview=1':''),{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  const title=page.getByRole('heading',{name:'The Crates.',exact:true});
  const intro=page.locator('.editorialIntro');const paragraph=intro.locator('p'),action=intro.getByRole('link');
  const t=await title.boundingBox(),p=await paragraph.boundingBox(),a=await action.boundingBox();
  const line=await title.evaluate(e=>parseFloat(getComputedStyle(e).lineHeight));
  expect(t.height).toBeLessThanOrEqual(line+1);expect(p.y-t.y-t.height).toBeGreaterThanOrEqual(23);expect(a.y-p.y-p.height).toBeGreaterThanOrEqual(15);expect(a.height).toBeGreaterThanOrEqual(44);
  const label=page.getByRole('heading',{name:'Start somewhere good',exact:true});
  const labelGeometry=await label.evaluate(e=>({bottom:e.getBoundingClientRect().bottom,next:e.nextElementSibling.getBoundingClientRect().top}));
  expect(labelGeometry.next-labelGeometry.bottom).toBeGreaterThanOrEqual(9);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(!root)await page.screenshot({path:testInfo.outputPath(`crates-intro-${width}.png`)});
  // Explicit 200% text-size fixture: natural wrapping is allowed, clipping is not.
  await page.addStyleTag({content:'html{font-size:32px} .editorialIntro p,.editorialIntro a{font-size:200%!important;line-height:1.5!important}'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const enlarged=await action.boundingBox(),body=await paragraph.boundingBox();expect(enlarged.y).toBeGreaterThanOrEqual(body.y+body.height+15);
 }
});
