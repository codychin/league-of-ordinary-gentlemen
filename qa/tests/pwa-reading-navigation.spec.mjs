import {test,expect} from '@playwright/test';

// Standalone emulation exercises the real shell; it is not installed-iOS proof.
for(const root of ['','/sunday-crew','/doge']){
 test(`reading navigation remains anchored: ${root||'LOOG'}`,async({page},testInfo)=>{
  test.skip(testInfo.project.name==='desktop','The mobile tab bar is hidden on desktop.');
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  const samples=[];
  const check=async()=>{
   const s=await page.locator('.appTabBar').evaluate(el=>{
    const r=el.getBoundingClientRect(),v=visualViewport,style=getComputedStyle(el);
    return {scrollY,innerHeight,viewport:{height:v.height,offsetTop:v.offsetTop,scale:v.scale},rect:{top:r.top,bottom:r.bottom,height:r.height},bottom:parseFloat(style.bottom),position:style.position};
   });
   samples.push(s);
   expect(s.position).toBe('fixed');
   expect(Math.abs(s.rect.bottom-(s.viewport.offsetTop+s.viewport.height-s.bottom)),JSON.stringify(s)).toBeLessThanOrEqual(1);
  };
  const scrollByInput=async()=>{
   // Exercise browser input/compositor scrolling as well as scrollTo geometry.
   const mobileWebKit=testInfo.project.use.browserName==='webkit'&&testInfo.project.use.isMobile;
   if(mobileWebKit){
    testInfo.annotations.push({type:'limitation',description:'Playwright mobile WebKit has no wheel input; this case verifies programmatic scroll. webkit-input-390 covers wheel input separately.'});
    await page.evaluate(()=>scrollBy(0,600));
   }else await page.mouse.wheel(0,600);
   await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
   await check();
   await testInfo.attach(mobileWebKit?'after-programmatic-scroll':'after-input-scroll',{body:await page.screenshot(),contentType:'image/png'});
  };
  try{
   const first=`${root}/articles/maude-nfc-east-declines-winner`;
   expect((await page.goto(first)).status()).toBe(200);
   await expect(page.locator('.appTabBar')).toBeVisible();
   await check();
   await scrollByInput();
   for(const height of [844,500,844]){
    await page.setViewportSize({width:testInfo.project.use.viewport.width,height});
    for(const y of [0,400,100000,200,0]){
     await page.evaluate(y=>window.scrollTo(0,y),y);
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     await check();
    }
   }
   await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
   await check();
   const bounds=await page.locator('main').evaluate(e=>({bottom:e.getBoundingClientRect().bottom,navTop:document.querySelector('.appTabBar').getBoundingClientRect().top}));
   expect(bounds.bottom).toBeLessThanOrEqual(bounds.navTop);
   await page.getByRole('button',{name:'More',exact:true}).click();
   await expect(page.getByRole('complementary',{name:'More and settings'})).toBeVisible();
   await page.getByRole('button',{name:'Close more menu'}).click();
   expect((await page.goto(`${root}/articles/marnie-marvin-harrison-somewhere-else`)).status()).toBe(200);
   await check();
   await scrollByInput();
   await page.goBack();
   await expect(page).toHaveURL(new RegExp(first+'$'));
   await check();
   await expect(page.getByRole('link',{name:'Scores',exact:true})).toBeVisible();
  }finally{
   await testInfo.attach('viewport-samples',{body:JSON.stringify(samples,null,2),contentType:'application/json'});
  }
 });
}
