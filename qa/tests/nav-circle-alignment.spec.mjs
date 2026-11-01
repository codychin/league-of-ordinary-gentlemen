import {test,expect} from '../helpers/browser.mjs';

test.beforeEach(async({page})=>{
  await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));
});

for(const root of ['', '/doge', '/sunday-crew'])for(const standalone of [false,true]){
  test(`selected circle stays centered ${root||'Brief'} ${standalone?'standalone':'browser'}`,async({page})=>{
    test.skip(page.viewportSize().width>760,'Mobile navigation only');
    if(standalone)await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(`${root}/articles/marnie-detroit-school`);
    const nav=page.getByRole('navigation',{name:'App navigation'});
    await expect(nav).toBeVisible();
    if(standalone)await expect(page.locator('html')).toHaveClass(/standaloneApp/);
    // Explicit inset fixtures: browsers without native safe-area emulation still
    // exercise the production anchor calculation, without moving the circle.
    await page.addStyleTag({content:'.appTabBar{bottom:max(3px,calc(var(--qa-bottom-inset,0px) - 8px))!important}'});
    for(const inset of [0,21,34]){
      await page.evaluate(v=>document.documentElement.style.setProperty('--qa-bottom-inset',`${v}px`),inset);
      for(const compact of [false,true]){
        await page.evaluate(y=>{
          window.dispatchEvent(new WheelEvent('wheel',{deltaY:y-window.scrollY}));
          window.scrollTo({top:y,behavior:'instant'});
        },compact?500:0);
        await expect(nav).toHaveAttribute('data-compact',String(compact));
        await expect(nav).toHaveCSS('height',compact?'50px':'54px');
        const m=await nav.evaluate(n=>{
          const b=n.getBoundingClientRect(),g=n.querySelector('.appTabGlider'),r=g.getBoundingClientRect(),s=getComputedStyle(g,'::after');
          const border=parseFloat(s.borderTopWidth)+parseFloat(s.borderBottomWidth);
          const h=parseFloat(s.height)+(s.boxSizing==='border-box'?0:border);
          return{delta:r.top+h/2-(b.top+b.height/2),bottom:innerHeight-b.bottom,controls:[...n.querySelectorAll(':scope>a,:scope>button')].map(e=>e.getBoundingClientRect().height)};
        });
        expect(Math.abs(m.delta),'visible circle center versus glass bar center').toBeLessThanOrEqual(.25);
        expect(m.bottom).toBeCloseTo(Math.max(3,inset-8),1);
        expect(m.controls.every(h=>h>=44)).toBe(true);
      }
    }
    await nav.getByRole('link',{name:'Culture',exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('data-app-tab','culture');
    await expect(nav).toHaveAttribute('data-compact','false');
    await nav.getByRole('link',{name:'Home',exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('data-app-tab','home');
  });
}
