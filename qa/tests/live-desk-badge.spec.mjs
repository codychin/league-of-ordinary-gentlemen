import {test,expect} from '../helpers/browser.mjs';

for(const root of ['', '/doge', '/sunday-crew'])for(const standalone of [false,true])test(`minimal live badge ${root||'Brief'} ${standalone?'standalone':'browser'}`,async({page},testInfo)=>{
  test.skip(standalone&&page.viewportSize().width>760,'Standalone mobile only');
  if(standalone)await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  await page.clock.install();
  let posts=[];
  await page.route('**/functions/v1/brief-live-desk?**',r=>r.fulfill({json:{posts}}));
  await page.goto(root||'/');
  await expect(page.locator('.appTabBar')).toHaveAttribute('data-compact','false');
  // Change the client clock only after hydration, avoiding an artificial
  // server/client scoreboard-phase mismatch in this badge fixture.
  await page.clock.setSystemTime(new Date('2026-11-01T18:00:00Z'));
  await page.clock.runFor(31000);
  const desk=page.getByRole('region',{name:'Sunday Live Desk'}),badge=desk.locator('.deskStatus');
  await expect(desk).toBeVisible();
  await expect(desk.locator('.deskEmpty')).toContainText('Coverage will appear');
  await expect(badge).toHaveText('LIVE NOW');
  await expect(badge).toHaveCSS('border-top-width','0px');
  await expect(badge).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(badge).toHaveCSS('font-size','12px');
  const geometry=await badge.evaluate(e=>{const b=e.getBoundingClientRect(),d=e.querySelector('i').getBoundingClientRect();return{delta:d.y+d.height/2-b.y-b.height/2,width:d.width,height:d.height,overflow:e.scrollWidth>e.clientWidth}});
  expect(Math.abs(geometry.delta)).toBeLessThanOrEqual(.5);
  expect(geometry.width).toBe(10);expect(geometry.height).toBe(10);expect(geometry.overflow).toBe(false);
  posts=Array.from({length:7},(_,i)=>({id:`fixture-${i}`,writer:i%2?'gannon':'march',published_at:`2026-11-01T17:0${i}:00Z`,subject:`Fixture dispatch ${i}`,text:'A substantive test report preserves the live desk content and reading order.',tag:'REPORT'}));
  await page.clock.runFor(21000);
  await expect(desk.locator('.deskPost')).toHaveCount(5);
  await desk.getByRole('button',{name:'OLDER',exact:false}).click();
  await expect(desk.locator('.deskPost')).toHaveCount(2);
  await desk.getByRole('button',{name:'MAUDE',exact:true}).click();
  await expect(desk.locator('.deskPost')).toHaveCount(3);
  await expect(badge).toHaveCSS('border-top-width','0px');
  await badge.screenshot({path:testInfo.outputPath(`live-badge-${root.slice(1)||'brief'}.png`)});
});
