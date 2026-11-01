import {test,expect} from '../helpers/browser.mjs';

const article='/articles/marnie-detroit-school';
const navFor=page=>page.getByRole('navigation',{name:'App navigation'});
async function ready(page){
  await page.goto(article);
  await expect(page.getByRole('button',{name:'Share this article'})).toBeEnabled();
}
async function scroll(page,y){
  await page.evaluate(y=>{
    window.dispatchEvent(new WheelEvent('wheel',{deltaY:y-window.scrollY}));
    window.scrollTo({top:y,behavior:'instant'});
  },y);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function targets(nav){
  for(const control of await nav.locator(':scope > a, :scope > button').all()){
    const box=await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
}
test.beforeEach(async({page})=>{
  await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));
});

test('mobile glass nav compacts only after meaningful scrolling and resists jitter',async({page})=>{
  test.skip(page.viewportSize().width>760,'Mobile behavior only');
  await ready(page);
  const nav=navFor(page);
  await expect(nav).toHaveCSS('height','54px');
  const initial=await nav.evaluate(e=>({bottom:getComputedStyle(e).bottom,background:getComputedStyle(e).backgroundImage,width:e.getBoundingClientRect().width}));
  await targets(nav);
  await page.mouse.move(100,250);
  await page.mouse.wheel(0,500);
  await expect(nav).toHaveAttribute('data-compact','true');
  await scroll(page,0);
  await scroll(page,90);
  await expect(nav).toHaveAttribute('data-compact','false');
  for(let cycle=0;cycle<3;cycle++){
    await scroll(page,240);await scroll(page,600);
    await expect(nav).toHaveAttribute('data-compact','true');
    await expect(nav).toHaveCSS('height','50px');
    await targets(nav);
    await expect(nav).toHaveCSS('bottom',initial.bottom);
    await expect(nav).toHaveCSS('background-image',initial.background);
    expect((await nav.boundingBox()).width).toBeLessThan(initial.width);
    for(const y of [598,601,599,602]){await scroll(page,y);await expect(nav).toHaveAttribute('data-compact','true')}
    await scroll(page,560);
    await expect(nav).toHaveAttribute('data-compact','false');
    await expect(nav).toHaveCSS('height','54px');
    await scroll(page,0);
    await expect(nav).toHaveAttribute('data-compact','false');
  }
});

test('mobile nav expands for menus, tabs and article history transitions',async({page})=>{
  test.skip(page.viewportSize().width>760,'Mobile behavior only');
  await ready(page);
  const nav=navFor(page);
  await scroll(page,500);await expect(nav).toHaveAttribute('data-compact','true');
  await nav.getByRole('button',{name:'More',exact:true}).click();
  await expect(page.getByRole('complementary',{name:'More and settings'})).toBeVisible();
  await expect(nav).toHaveAttribute('data-compact','false');
  await scroll(page,800);await expect(nav).toHaveAttribute('data-compact','false');
  await page.getByRole('button',{name:'Close more menu'}).click();
  await nav.getByRole('link',{name:'Home',exact:true}).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(nav).toHaveAttribute('data-compact','false');
  await nav.getByRole('link',{name:'Culture',exact:true}).click();
  await expect(page).toHaveURL(/#culture$/);
  // Anchor scrolling must not immediately compact a newly selected tab.
  await expect(nav).toHaveAttribute('data-compact','false');
  await nav.getByRole('link',{name:'Home',exact:true}).click();
  await page.locator('[data-editorial-layout="open-top"] .sabinePackageTitle').click();
  await expect(page).toHaveURL(new RegExp(article+'$'));
  await expect(nav).toHaveAttribute('data-compact','false');
  await scroll(page,400);await expect(nav).toHaveAttribute('data-compact','true');
  await page.goBack();
  await expect(nav).toHaveAttribute('data-compact','false');
});

test('mobile compaction respects editing, keyboard access and reduced motion',async({page})=>{
  test.skip(page.viewportSize().width>760,'Mobile behavior only');
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  const nav=navFor(page);
  await scroll(page,500);await expect(nav).toHaveAttribute('data-compact','true');
  await expect(nav).toHaveCSS('transition-duration','0s');
  await expect(nav.locator('svg').first()).toHaveCSS('transition-duration','0s');
  await page.evaluate(()=>{
    const input=document.createElement('input');input.id='qa-editing';input.setAttribute('aria-label','Editing fixture');
    input.style.cssText='position:fixed;top:80px;left:20px;z-index:2000';document.body.append(input);input.focus({preventScroll:true});
  });
  await expect(nav).toHaveAttribute('data-compact','false');
  await scroll(page,800);await expect(nav).toHaveAttribute('data-compact','false');
  await page.setViewportSize({...page.viewportSize(),height:540});
  await expect(nav).toBeVisible();await targets(nav);
  await page.evaluate(()=>{const input=document.getElementById('qa-editing');input.blur();input.remove()});
  await nav.getByRole('link',{name:'Home',exact:true}).focus();
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link',{name:'Scores',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#scores$/);
  await expect(nav).toHaveAttribute('data-compact','false');
});

test('desktop navigation does not compact on scroll',async({page})=>{
  test.skip(page.viewportSize().width<=760,'Desktop behavior only');
  await ready(page);
  const nav=page.locator('.appTabBar'),siteNav=page.locator('.siteNav');
  const height=await siteNav.evaluate(e=>getComputedStyle(e).height);
  await scroll(page,600);
  await expect(nav).toHaveAttribute('data-compact','false');
  await expect(nav).toBeHidden();
  await expect(siteNav).toHaveCSS('height',height);
});

test('installed web app keeps its fixed safe-area anchor through compact scrolling and tab changes',async({page})=>{
  test.skip(page.viewportSize().width>760,'Mobile behavior only');
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  await ready(page);
  await expect(page.locator('html')).toHaveClass(/standaloneApp/);
  const nav=navFor(page);
  const bottom=await nav.evaluate(e=>getComputedStyle(e).bottom);
  await scroll(page,500);
  await expect(nav).toHaveAttribute('data-compact','true');
  await expect(nav).toHaveCSS('height','50px');
  await expect(nav).toHaveCSS('bottom',bottom);
  await targets(nav);
  await nav.getByRole('link',{name:'Culture',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-app-tab','culture');
  await expect(nav).toHaveAttribute('data-compact','false');
  await nav.getByRole('link',{name:'Home',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-app-tab','home');
  await expect(nav).toHaveCSS('height','54px');
  await expect(nav).toHaveCSS('bottom',bottom);
});
