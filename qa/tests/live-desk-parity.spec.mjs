import {test,expect} from '../helpers/browser.mjs';
import {isSundayLiveWindow} from '../../lib/live-desk-state.js';
for(const root of ['', '/doge', '/sunday-crew'])for(const standalone of [false,true])test(`Live Desk reading roles and states ${root||'Brief'} ${standalone}`,async({page},testInfo)=>{
 test.skip(standalone&&page.viewportSize().width>760,'Standalone mobile only');
 if(standalone)await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 await page.clock.install();
 let mode='empty';let release;const gate=new Promise(r=>release=r);
 const posts=Array.from({length:7},(_,i)=>({id:`fixture-${i}`,writer:i%2?'gannon':'march',published_at:`2026-11-01T17:0${i}:00Z`,subject:'A deliberately long dispatch subject about the Sunday slate and its unfinished consequences',text:'This fixture is a complete paragraph with née, curly quotation marks and a long enough report to verify natural wrapping at narrow widths.',tag:'REPORT'}));
 await page.route('**/functions/v1/brief-live-desk?**',async r=>{await gate;await r.fulfill(mode==='error'?{status:503,json:{error:'fixture unavailable'}}:{json:{posts:mode==='populated'?posts:[]}})});
 await page.goto(root||'/');await expect(page.locator('.appTabBar')).toHaveAttribute('data-compact','false');
 await page.clock.setSystemTime(new Date('2026-11-01T18:00:00Z'));await page.clock.runFor(31000);
 const desk=page.getByRole('region',{name:'Sunday Live Desk'});
 await expect(desk.locator('.deskEmpty')).toContainText('Loading');release();
 await expect(desk.locator('.deskEmpty')).toContainText('Coverage will appear');
 await expect(desk.locator('.deskEmpty')).toHaveCSS('font-family','"Brief Body Reference 5", serif');
 await expect(desk.locator('.deskEmpty')).toHaveCSS('font-size','19px');
 await expect(desk.locator('.deskEmpty')).toHaveCSS('line-height','28px');
 await expect(desk.locator('.sundayDeskBrand h2')).toHaveCSS('font-family','"Brief Nine F Native Preview", serif');
 await expect(desk.locator('.deskFilters')).toHaveCSS('border-bottom-width','0px');
 await desk.screenshot({path:testInfo.outputPath('empty.png')});
 mode='error';await page.clock.runFor(21000);await expect(desk.locator('.deskEmpty')).toContainText('temporarily unavailable');
 mode='populated';await page.clock.runFor(21000);await expect(desk.locator('.deskPost')).toHaveCount(5);
 await expect(desk.locator('.deskPostBody p').first()).toHaveCSS('font-style','normal');
 await expect(desk.locator('.deskPostBody p').first()).toHaveCSS('font-size','19px');
 await expect(desk.locator('.deskPagination')).toHaveCSS('position','static');
 expect(await desk.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await desk.screenshot({path:testInfo.outputPath('populated.png')});
 await desk.getByRole('button',{name:'OLDER',exact:false}).click();await expect(desk.locator('.deskPost')).toHaveCount(2);
 await desk.getByRole('button',{name:'MAUDE',exact:true}).click();await expect(desk.locator('.deskPost')).toHaveCount(3);
});

test('score strip never flashes old week data and distinguishes weekly points from pregame',async({page})=>{
 // The server intentionally omits the strip outside the scheduled window.
 if(!isSundayLiveWindow()){
  await page.goto('/');await expect(page.locator('.sundayLiveStrip')).toHaveCount(0);return;
 }
 let release;const gate=new Promise(r=>release=r);
 await page.route('**/api/live-scores',async r=>{await gate;await r.fulfill({json:{week:8,source:'snapshot',stale:true,updatedAt:'2026-11-01T16:24:00Z',matchups:[{id:1,home:{name:'Fixture home',score:18.5},away:{name:'Fixture away',score:0}}]}})});
 await page.goto('/');const strip=page.locator('.sundayLiveStrip');await expect(strip.locator('.scoreLoading')).toContainText('Loading');
 await expect(strip).not.toContainText('Week 3');release();
 await expect(strip).toHaveAttribute('aria-label','Week 8 scoreboard');
 await expect(strip.locator('.liveStripMeta>span')).toHaveText('WEEK IN PROGRESS');
 await expect(strip.locator('.scoreStale')).toContainText('SCORES DELAYED');
});
