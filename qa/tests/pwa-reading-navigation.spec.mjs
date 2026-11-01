import {test,expect} from '@playwright/test';
import {isSundayLiveWindow} from '../../lib/live-desk-state.js';
import {readFileSync} from 'node:fs';
import {leagueSnapshot} from '../../app/teams/league-data.js';
import {selectMatchupColumn} from '../../lib/select-matchup-column.mjs';
const data=name=>JSON.parse(readFileSync(new URL('../../data/'+name,import.meta.url)));
const loogScores=data('latest-loog-scores.json');
const loogFixture=loogScores.matchups[0];
const loogFinal=Boolean(loogFixture.winner&&loogFixture.winner!=='UNDECIDED');
const loogColumn=selectMatchupColumn({previews:[...data('week6-matchup-columns.json'),...data('week7-matchup-columns.json')],recaps:data('matchup-recaps.json'),edition:'loog',week:loogScores.week,a:loogFixture.home.id,b:loogFixture.away.id,isFinal:loogFinal});
const teamSlug=id=>Object.keys(leagueSnapshot.teams).find(slug=>leagueSnapshot.teams[slug].teamId===id);
const loogMatchupPath=`/matchups/${teamSlug(loogFixture.home.id)}/${teamSlug(loogFixture.away.id)}`;

const liveDeskFixture=()=>({posts:Array.from({length:5},(_,i)=>({id:'live-layout-fixture-'+i,writer:'gannon',subject:'Live layout fixture '+i,text:'Fixture reporting used only to exercise document layout. '.repeat(8),published_at:new Date().toISOString(),source_url:'https://example.com'}))});
async function settleInitialLiveDesk(page){
 // Pin initial feed data, not geometry; keep the restoration assertions unchanged.
 await page.route('**/brief-live-desk?*',route=>route.fulfill({json:liveDeskFixture()}));
}
async function waitForInitialLiveDesk(page){
 if(isSundayLiveWindow())await expect(page.locator('.sundayDesk .deskPost')).toHaveCount(5);
}


const readingPosition=element=>{
 const top=element.getBoundingClientRect().top;
 return {scrollY:window.scrollY,top,documentTop:top+window.scrollY,documentHeight:document.documentElement.scrollHeight};
};
function expectReadingPosition(before,after){
 // Absolute scrollY can legitimately track layout growth above the reader (for
 // example the asynchronous X embed). The reader must keep the same visible anchor.
 expect(Math.abs(after.top-before.top),JSON.stringify({before,after})).toBeLessThanOrEqual(1);
}

// Production document-scroll navigation, standalone emulation. The held viewport
// shell remains in PR83; this suite retains the same interactions and visible-bottom
// assertions against production fixed navigation, not a claim that iOS drift is fixed. Keyboard-height and tab switching are engine
// contracts, not claims of an installed iPhone keyboard/background reproduction.
for(const root of ['','/sunday-crew','/doge']){
 test(`production document-scroll navigation: ${root||'LOOG'}`,async({page,context,browserName},testInfo)=>{
  test.skip(testInfo.project.name==='desktop','Mobile shell is inactive on desktop.');
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  if(!root)testInfo.annotations.push({type:'fixture',description:'LOOG matchup uses the committed current-week score snapshot via QA-only server preload; this tests layout and publication state, not live provider correctness.'});
  const samples=[],content=page.locator('html');
  const check=async(label)=>{
   const s=await page.locator('.appTabBar').evaluate(el=>{
    const r=el.getBoundingClientRect(),v=visualViewport,c=document.scrollingElement,style=getComputedStyle(el);
    return {path:location.pathname,scrollY,innerHeight,visibility:document.visibilityState,viewport:v?{height:v.height,offsetTop:v.offsetTop,scale:v.scale}:null,rect:{top:r.top,bottom:r.bottom,height:r.height},content:{scrollTop:c.scrollTop,scrollHeight:c.scrollHeight},bottom:parseFloat(style.bottom),transform:style.transform,position:style.position};
   });samples.push({label,...s});
   expect(s.position).toBe('fixed');expect(s.scrollY).toBe(s.content.scrollTop);
   await expect(page.locator('.appScrollContent')).toHaveCount(0);
   const visibleBottom=s.viewport?s.viewport.offsetTop+s.viewport.height:s.innerHeight;
   expect(Math.abs(visibleBottom-s.rect.bottom-s.bottom),JSON.stringify(s)).toBeLessThan(2);

  };
  const scroll=async y=>{await content.evaluate((el,y)=>el.scrollTo(0,y),y);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await check('scroll');};
  const inputScroll=async()=>{
   if(browserName==='webkit'&&testInfo.project.use.isMobile){
    testInfo.annotations.push({type:'limitation',description:'Mobile WebKit has no wheel support; programmatic content scroll here, narrow WebKit project uses real wheel input.'});
    await content.evaluate(e=>e.scrollBy(0,500));
   }else{await page.mouse.move(180,300);await page.mouse.wheel(0,500);}
   await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await check('input');
  };
  try{
   const home=root||'/';
   expect((await page.goto(home)).status()).toBe(200);await expect(page.locator('.appTabBar')).toBeVisible();await check('home');await inputScroll();
   // Use an actual client-side article link and preserve the existing back-to-top contract.
   const link=page.locator('a[href*="/articles/"]').first();
   const article=await link.getAttribute('href');await link.click();
   await expect(page).toHaveURL(new RegExp(article+'$'));await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);await inputScroll();
   for(const height of [844,500,844]){await page.setViewportSize({width:testInfo.project.use.viewport.width,height});for(const y of [0,400,100000,200,0])await scroll(y);}
   // Labelled fixture input: no existing article input or real keyboard is implied.
   await content.evaluate(e=>{const input=document.createElement('input');input.id='qa-focus-fixture';input.setAttribute('aria-label','QA focus fixture');input.style.cssText='display:block;margin:16px 16px 100px;width:240px;height:40px';document.body.append(input);});
   const input=page.getByRole('textbox',{name:'QA focus fixture'});await input.focus();await page.setViewportSize({width:testInfo.project.use.viewport.width,height:500});await input.press('End');await input.scrollIntoViewIfNeeded();
   await expect(input).toBeFocused();const focus=await input.boundingBox(),nav=await page.locator('.appTabBar').boundingBox();expect(focus.y).toBeGreaterThanOrEqual(0);expect(focus.y+focus.height).toBeLessThanOrEqual(nav.y);await check('focused-shrunken-viewport');
   await input.evaluate(e=>e.remove());await page.setViewportSize({width:testInfo.project.use.viewport.width,height:844});await scroll(400);
   const before=await content.evaluate(e=>e.scrollTop);const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await page.bringToFront();await other.close();
   if(browserName==='chromium'){const session=await context.newCDPSession(page);await session.send('Page.setWebLifecycleState',{state:'frozen'});await session.send('Page.setWebLifecycleState',{state:'active'});await session.detach();}
   else testInfo.annotations.push({type:'limitation',description:'WebKit tab switch tested; OS process suspension and installed-app resume unavailable.'});
   expect(await content.evaluate(e=>e.scrollTop)).toBe(before);await check('resume');
   await page.getByRole('button',{name:'More',exact:true}).click();await expect(page.getByRole('complementary',{name:'More and settings'})).toBeVisible();await page.getByRole('button',{name:'Close more menu'}).click();
   await page.goBack();await expect(page).toHaveURL(new RegExp(root?root+'/?$':'/$'));await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);await check('back');
   await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Scores',exact:true}).click();await expect(page).toHaveURL(/#scores$/);await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);await check('scores');
   await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Culture',exact:true}).click();await expect(page).toHaveURL(/#culture$/);await check('culture');
   await page.goBack();await expect(page).toHaveURL(/#scores$/);await check('hash-back');
   await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Teams',exact:true}).click();
   await expect(page).toHaveURL(new RegExp(root+'/teams$'));await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);
   for(const y of [0,400,100000,0])await scroll(y);await check('teams');
   await page.getByRole('navigation',{name:'App navigation'}).getByRole('link',{name:'Scores',exact:true}).click();await expect(page).toHaveURL(/#scores$/);
   // The QA server pins the committed LOOG score snapshot so this route
   // exercises the current pairing, including its actual publication state.
   const matchup=root?await page.locator('a[href*="/matchups/"]').first().getAttribute('href'):loogMatchupPath;
   expect((await page.goto(matchup)).status()).toBe(200);await expect(page.locator('main.matchupPage')).toBeVisible();await expect(page.locator('.matchupColumn')).toBeVisible();
   if(!root){
    await expect(page.locator('.matchupHeroSide h1')).toHaveText([loogFixture.home.name,loogFixture.away.name]);
    if(loogColumn){
     await expect(page.locator('.matchupColumn h2')).toHaveText(loogColumn.headline);
     const paragraphs=loogColumn.body.split(/\n\n+/);
     for(let i=0;i<paragraphs.length;i++)await expect(page.locator('.matchupColumn > p').nth(i)).toHaveText(paragraphs[i]);
     expect((await page.locator('.matchupColumn').innerText()).length).toBeGreaterThan(300);
    }else{
     await expect(page.locator('.matchupColumn h2')).toHaveText(loogFinal?'Awaiting correspondent recap':'Awaiting correspondent preview');
     await expect(page.locator('.matchupColumn > p').first()).toHaveText(loogFinal?'The result is final. The correspondent recap is awaiting publication.':'The correspondent preview for this pairing is awaiting publication.');
     await expect(page.locator('.matchupColumn > p')).toHaveCount(2);
    }
    expect(await content.evaluate(e=>e.scrollHeight-e.clientHeight)).toBeGreaterThan(500);
   }
   for(const height of [844,500,844]){await page.setViewportSize({width:testInfo.project.use.viewport.width,height});for(const y of [0,400,100000,200,0])await scroll(y);}
   await inputScroll();await check('matchup');await page.goBack();await expect(page).toHaveURL(/#scores$/);await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBe(0);await check('matchup-back');
   await testInfo.attach('shell-after-flow',{body:await page.screenshot(),contentType:'image/png'});
  }finally{await testInfo.attach('viewport-samples',{body:JSON.stringify(samples,null,2),contentType:'application/json'});}
 });
}

test('reel viewers restore the standalone document position',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='desktop','Standalone mobile scroll-owner contract.');
 await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 // Media readiness and initial feed data are fixtures; real components and controls are tested.
 await settleInitialLiveDesk(page);
 await page.route('**/reels-hls/**',route=>route.request().method()==='HEAD'?route.fulfill({status:200,body:''}):route.abort());
 await page.goto('/');await waitForInitialLiveDesk(page);const content=page.locator('html');
 const shelves=[page.getByRole('region',{name:/videos$/}).first(),page.getByRole('region',{name:'Also, from The Brief'})];
 for(const shelf of shelves){
  const watch=shelf.getByRole('button',{name:/^Watch /}).first();await expect(watch).toBeVisible();await watch.scrollIntoViewIfNeeded();
  // Playwright may scroll again while waiting for a late-loading card to stabilize.
  // Capture the user's actual opening position at click, before React opens the viewer.
  await watch.evaluate(el=>el.addEventListener('click',()=>{
   const top=el.getBoundingClientRect().top;
   window.__qaReelOpening={scrollY,top,documentTop:top+scrollY,documentHeight:document.documentElement.scrollHeight};
  },{capture:true,once:true}));
  await watch.click();const before=await page.evaluate(()=>window.__qaReelOpening);
  await expect(page.getByRole('dialog')).toBeVisible();expect(await page.locator('body').evaluate(e=>getComputedStyle(e).overflowY)).toBe('hidden');
  await page.getByRole('button',{name:'Close video',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  try{await expect(async()=>expectReadingPosition(before,await watch.evaluate(readingPosition))).toPass({timeout:10000});}
  finally{await testInfo.attach('reel-restoration',{body:JSON.stringify({shelf:await shelf.getAttribute('aria-label'),before,after:await watch.evaluate(readingPosition)}),contentType:'application/json'});}
  expect(await content.evaluate(e=>getComputedStyle(e).overflowY)).not.toBe('hidden');
 }
});

test('reading-position assertion accepts anchored reflow and rejects a real scroll jump',async({page})=>{
 // Reproduce the measured 528px false positive without relying on a live embed's timing.
 await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><div id="above" style="height:1000px"></div><button id="anchor">Reading anchor</button><div style="height:2000px"></div>');
 const anchor=page.locator('#anchor');await page.evaluate(()=>scrollTo(0,800));
 const before=await anchor.evaluate(readingPosition);
 await page.evaluate(()=>{document.querySelector('#above').style.height='1528px';scrollTo(0,1328);});
 const anchored=await anchor.evaluate(readingPosition);
 expect(anchored.scrollY-before.scrollY).toBe(528);
 expect(anchored.documentTop-before.documentTop).toBe(528);
 expectReadingPosition(before,anchored);
 // Same document geometry, but genuinely wrong restoration: this must still fail.
 await page.evaluate(()=>scrollBy(0,100));const jumped=await anchor.evaluate(readingPosition);
 expect(()=>expectReadingPosition(before,jumped)).toThrow();
});


test('normal browser keeps document navigation and reel restoration',async({page},testInfo)=>{
 await settleInitialLiveDesk(page);
 await page.route('**/reels-hls/**',route=>route.request().method()==='HEAD'?route.fulfill({status:200,body:''}):route.abort());
 expect((await page.goto('/')).status()).toBe(200);await waitForInitialLiveDesk(page);
 // The server document can load before the shell's initial location reset.
 // Exercise navigation after hydration, rather than racing that reset in WebKit.
 await expect(page.locator('html')).toHaveAttribute('data-app-tab','home');
 expect(await page.locator('html').evaluate(e=>e.classList.contains('standaloneApp'))).toBe(false);
 await expect(page.locator('.appScrollContent')).toHaveCount(0);
 await page.evaluate(()=>window.scrollTo(0,400));await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
 const article=page.locator('a[href*="/articles/"]').first();const path=await article.getAttribute('href');await article.click();await expect(page).toHaveURL(new RegExp(path+'$'));await page.goBack();await expect(page).toHaveURL(/\/$/);
 const watch=page.getByRole('region',{name:/videos$/}).first().getByRole('button',{name:/^Watch /}).first();await watch.scrollIntoViewIfNeeded();
 await watch.evaluate(el=>el.addEventListener('click',()=>{window.__qaBrowserReelOpening=scrollY;},{capture:true,once:true}));await watch.click();
 const before=await page.evaluate(()=>window.__qaBrowserReelOpening);await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close video',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(before);
 await expect(page.locator('.appScrollContent')).toHaveCount(0);
 await testInfo.attach('normal-browser-reel-restoration',{body:JSON.stringify({before,after:await page.evaluate(()=>scrollY)}),contentType:'application/json'});
});

// Exercise late content while the real viewer is locked; no relaxed assertion.
test('reel close preserves its visible anchor when content above grows',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='desktop','Standalone mobile scroll-owner contract.');
 await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 await settleInitialLiveDesk(page);
 await page.route('**/reels-hls/**',route=>route.request().method()==='HEAD'?route.fulfill({status:200,body:''}):route.abort());
 await page.goto('/');await waitForInitialLiveDesk(page);
 const shelf=page.getByRole('region',{name:/videos$/}).first();
 const watch=shelf.getByRole('button',{name:/^Watch /}).first();await watch.scrollIntoViewIfNeeded();
 await watch.evaluate(el=>el.addEventListener('click',()=>{window.__qaOpeningTop=el.getBoundingClientRect().top;},{capture:true,once:true}));
 await watch.click();await expect(page.getByRole('dialog')).toBeVisible();
 const before=await page.evaluate(()=>window.__qaOpeningTop);
 // Deterministic equivalent of the observed delayed Live Desk insertion.
 await shelf.evaluate(el=>{const growth=document.createElement('div');growth.style.height='1900px';growth.id='qa-live-growth';el.before(growth);});
 await page.getByRole('button',{name:'Close video',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect.poll(async()=>Math.abs((await watch.evaluate(el=>el.getBoundingClientRect().top))-before)).toBeLessThanOrEqual(1);
});

// AlsoShelf is the last visible standalone section: opening removes main's
// paint containment and can clamp document scroll before the user presses Close.
for(const growth of [0,528,1900]){
 test(`Also shelf restores its bottom-of-document anchor with ${growth}px reflow`,async({page},testInfo)=>{
  if(testInfo.project.name==='desktop')await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  await settleInitialLiveDesk(page);
  await page.route('**/reels-hls/**',route=>route.request().method()==='HEAD'?route.fulfill({status:200,body:''}):route.abort());
  await page.goto('/');await waitForInitialLiveDesk(page);
  const shelf=page.getByRole('region',{name:'Also, from The Brief'});
  const watch=shelf.getByRole('button',{name:/^Watch /}).first();
  await expect(watch).toBeVisible();await watch.scrollIntoViewIfNeeded();
  await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await watch.evaluate(el=>el.addEventListener('click',()=>{
   const top=el.getBoundingClientRect().top;
   window.__qaAlsoOpening={scrollY,top,documentTop:top+scrollY,documentHeight:document.documentElement.scrollHeight};
  },{capture:true,once:true}));
  await watch.click();const before=await page.evaluate(()=>window.__qaAlsoOpening);
  expect(Math.abs(before.documentHeight-before.scrollY-page.viewportSize().height)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('dialog')).toBeVisible();
  const locked=await watch.evaluate(readingPosition);
  if(growth)await shelf.evaluate((el,height)=>{
   const above=document.createElement('div');above.style.height=`${height}px`;el.before(above);
  },growth);
  // Advancing must keep the original opening anchor and the same lock session.
  await page.getByRole('button',{name:'Next video',exact:true}).click();
  await page.getByRole('button',{name:'Previous video',exact:true}).click();
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).overflowY)).toBe('hidden');
  await page.getByRole('button',{name:'Close video',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  try{await expect(async()=>expectReadingPosition(before,await watch.evaluate(readingPosition))).toPass({timeout:10000});}
  finally{await testInfo.attach('also-bottom-restoration',{body:JSON.stringify({growth,before,locked,after:await watch.evaluate(readingPosition)}),contentType:'application/json'});}
  expect(await page.locator('html').evaluate(el=>getComputedStyle(el).overflowY)).not.toBe('hidden');
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).overflowY)).not.toBe('hidden');
 });
}

for (const root of ['', '/sunday-crew', '/doge']) {
  test(`current previews replace the active recap shelf: ${root || 'LOOG'}`, async ({page}) => {
    expect((await page.goto(root || '/')).status()).toBe(200);
    const shelf=page.locator('section[aria-label="Week 8, the previews. videos"]');
    await expect(shelf).toHaveCount(1);
    await expect(shelf.getByRole('button', {name:/^Watch /})).toHaveCount(6);
    await expect(page.locator('section[aria-label="Week 7, the recaps. videos"]')).toHaveCount(0);
    await expect(page.locator('section[aria-label$=" videos"]')).toHaveCount(1);
  });
}
