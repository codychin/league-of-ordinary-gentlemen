import {test,expect} from '@playwright/test';
import {documentScrollSample,assertDocumentScrollSample} from '../helpers/document-scroll-contract.mjs';
import {isSundayLiveWindow} from '../../lib/live-desk-state.js';
import {readFileSync} from 'node:fs';
import {leagueSnapshot} from '../../app/teams/league-data.js';
import {selectMatchupColumn} from '../../lib/select-matchup-column.mjs';
import {selectLoogScores} from '../../lib/select-loog-scores.mjs';
const data=name=>JSON.parse(readFileSync(new URL('../../data/'+name,import.meta.url)));
// Match the app's selection, including the completed-week hold and later corrections.
const latestLoogScores=data('latest-loog-scores.json');
const loogScores=selectLoogScores({provider:latestLoogScores,latest:latestLoogScores,completed:data('completed-loog-scores.json')});
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
 const owner=document.scrollingElement;
 return {scrollY:owner.scrollTop,top,documentTop:top+owner.scrollTop,documentHeight:owner.scrollHeight,clientHeight:owner.clientHeight};
};
function expectReadingPosition(before,after){
 // Absolute scrollY can legitimately track layout growth above the reader (for
 // example the asynchronous X embed). The reader must keep the same visible anchor.
 expect(Math.abs(after.top-before.top),JSON.stringify({before,after})).toBeLessThanOrEqual(1);
}

test('document-scroll geometry rejects real DOM regressions',async({page})=>{
 // Labelled geometry fixture: validates the assertion, not production appearance.
 await page.setContent('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><div style="height:3000px"></div><nav id="qa-nav" style="position:fixed;left:12px;right:12px;bottom:3px;height:54px"></nav>');
 await page.evaluate(()=>scrollTo(0,400));
 const nav=page.locator('#qa-nav');
 assertDocumentScrollSample(await nav.evaluate(documentScrollSample));
 await nav.evaluate(el=>el.style.position='absolute');
 const absolute=await nav.evaluate(documentScrollSample);expect(()=>assertDocumentScrollSample(absolute)).toThrow();
 await nav.evaluate(el=>{el.style.position='fixed';el.style.bottom='-100px';});
 const offscreen=await nav.evaluate(documentScrollSample);expect(()=>assertDocumentScrollSample(offscreen)).toThrow();
 await nav.evaluate(el=>el.style.bottom='3px');
 await page.evaluate(()=>document.body.style.overflow='hidden');
 const locked=await nav.evaluate(documentScrollSample);expect(()=>assertDocumentScrollSample(locked)).toThrow();
 await page.evaluate(()=>document.body.style.overflow='');
 assertDocumentScrollSample(await nav.evaluate(documentScrollSample));
});

// Current document-scroll contract with viewport-bounded fixed navigation. Keyboard-height and tab switching
// exercise engine geometry, not installed-iPhone keyboard/background reproduction.
for(const root of ['','/sunday-crew','/doge']){
 test(`bounded standalone navigation: ${root||'LOOG'}`,async({page,context,browserName},testInfo)=>{
  test.skip(testInfo.project.name==='desktop','Mobile shell is inactive on desktop.');
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  if(!root)testInfo.annotations.push({type:'fixture',description:'LOOG matchup uses the committed current-week score snapshot via QA-only server preload; this tests layout and publication state, not live provider correctness.'});
  const samples=[],content=page.locator('html');
  const check=async(label)=>{
   const s=await page.locator('.appTabBar').evaluate(documentScrollSample);samples.push({label,...s});
   assertDocumentScrollSample(s);

  };
  const scroll=async y=>{await content.evaluate((el,y)=>el.scrollTo(0,y),y);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await check('scroll');};
  const inputScroll=async()=>{
   if(browserName==='webkit'&&testInfo.project.use.isMobile){
    testInfo.annotations.push({type:'limitation',description:'Mobile WebKit has no wheel support; programmatic document scroll here, narrow WebKit project uses real wheel input.'});
    await content.evaluate(e=>e.scrollBy(0,500));
   }else{await page.mouse.move(180,300);await page.mouse.wheel(0,500);}
   await expect.poll(()=>content.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await check('input');
  };
  try{
   const home=root||'/';
   expect((await page.goto(home)).status()).toBe(200);await expect(page.locator('.appTabBar')).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-app-tab','home');await check('home');await inputScroll();
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

test('reel viewers restore the standalone content position',async({page},testInfo)=>{
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
   const top=el.getBoundingClientRect().top,owner=document.scrollingElement;
   window.__qaReelOpening={scrollY:owner.scrollTop,top,documentTop:top+owner.scrollTop,documentHeight:owner.scrollHeight,clientHeight:owner.clientHeight};
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
 expect(await page.evaluate(()=>document.scrollingElement===document.documentElement)).toBe(true);
 await expect(page.locator('.appScrollContent')).toHaveCount(0);
 await page.evaluate(()=>window.scrollTo(0,400));await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
 const article=page.locator('a[href*="/articles/"]').first();const path=await article.getAttribute('href');await article.click();await expect(page).toHaveURL(new RegExp(path+'$'));await page.goBack();await expect(page).toHaveURL(/\/$/);
 const watch=page.getByRole('region',{name:/videos$/}).first().getByRole('button',{name:/^Watch /}).first();await watch.scrollIntoViewIfNeeded();
 await watch.evaluate(el=>el.addEventListener('click',()=>{window.__qaBrowserReelOpening=scrollY;},{capture:true,once:true}));await watch.click();
 const before=await page.evaluate(()=>window.__qaBrowserReelOpening);await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close video',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(before);
 expect(await page.evaluate(()=>document.scrollingElement===document.documentElement)).toBe(true);
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
// paint containment and can clamp content scroll before the user presses Close.
for(const growth of [0,528,1900]){
 test(`Also shelf restores its bottom-of-content anchor with ${growth}px reflow`,async({page},testInfo)=>{
  if(testInfo.project.name==='desktop')await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  await settleInitialLiveDesk(page);
  await page.route('**/reels-hls/**',route=>route.request().method()==='HEAD'?route.fulfill({status:200,body:''}):route.abort());
  await page.goto('/');await waitForInitialLiveDesk(page);
  const shelf=page.getByRole('region',{name:'Also, from The Brief'});
  const watch=shelf.getByRole('button',{name:/^Watch /}).first();
  await expect(watch).toBeVisible();await watch.scrollIntoViewIfNeeded();
  await page.locator('html').evaluate(el=>el.scrollTo({top:el.scrollHeight,behavior:'instant'}));
  // Reproduce late pre-click layout growth: a prior scrollTo(bottom) is not
  // an opening-position guarantee while media, fonts and click actionability settle.
  await shelf.evaluate(el=>{const growth=document.createElement('div');growth.style.height='43px';el.after(growth);});
  await watch.evaluate(el=>el.addEventListener('click',()=>{
   const owner=document.scrollingElement;
   // Establish the bottom-of-content fixture in the same event as the captured
   // anchor, before React opens/locks the viewer. Never correct after opening.
   owner.scrollTo({top:owner.scrollHeight,behavior:'instant'});
   const top=el.getBoundingClientRect().top;
   window.__qaAlsoOpening={scrollY:owner.scrollTop,top,documentTop:top+owner.scrollTop,documentHeight:owner.scrollHeight,clientHeight:owner.clientHeight};
  },{capture:true,once:true}));
  await watch.click();const before=await page.evaluate(()=>window.__qaAlsoOpening);
  expect(Math.abs(before.documentHeight-before.scrollY-before.clientHeight)).toBeLessThanOrEqual(1);
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
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).overflowY)).not.toBe('hidden');
  expect(await page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
 });
}

for (const root of ['', '/sunday-crew', '/doge']) {
  test(`Week 9 previews replace recaps while preserving archive history: ${root || 'LOOG'}`, async ({page}) => {
    const edition=root.slice(1)||'loog';
    const current=data('week9-approved-homepage-media.json').filter(r=>r.edition===edition);
    const recaps=data('week8-recap-approved-homepage-media.json').filter(r=>r.edition===edition);
    const previews=data('week8-approved-homepage-media.json').filter(r=>r.edition===edition);
    expect(recaps).toHaveLength(6);expect(previews).toHaveLength(6);
    expect((await page.goto(root || '/')).status()).toBe(200);
    const shelf=page.locator('section[aria-label="Week 9, the previews. videos"]');
    await expect(shelf).toHaveCount(1);
    const buttons=shelf.getByRole('button', {name:/^Watch /});
    await expect(buttons).toHaveCount(6);
    expect(await buttons.evaluateAll(elements=>elements.map(el=>el.getAttribute('aria-describedby')))).toEqual(current.map(r=>`reel-state-${edition}-week9-preview-v1-${r.id}`));
    await expect(page.locator('section[aria-label="Week 8, the previews. videos"]')).toHaveCount(0);
    await expect(page.locator('section[aria-label="Week 7, the recaps. videos"]')).toHaveCount(0);
    await expect(page.locator('section[aria-label$=" videos"]')).toHaveCount(1);
    expect((await page.goto(root+'/archive/watch')).status()).toBe(200);
    const archive=page.locator('section[aria-labelledby="games-heading"]');
    await expect(archive.getByRole('status')).toContainText('Week 9 · 6 videos');
    for(const row of current)await expect(archive.locator(`img[src*="${row.id}"]`)).toHaveCount(1);
    await page.getByRole('combobox',{name:/^Week/}).selectOption('8');
    await expect(archive.getByRole('status')).toContainText('Week 8 · 12 videos');
    await page.getByLabel('Coverage',{exact:false}).selectOption('preview');
    await expect(archive.getByRole('button',{name:/^Watch /})).toHaveCount(6);
    for(const row of previews)await expect(archive.locator(`img[src*="${row.id}"]`)).toHaveCount(1);
    await page.getByLabel('Coverage',{exact:false}).selectOption('recap');
    await expect(archive.getByRole('button',{name:/^Watch /})).toHaveCount(6);
    for(const row of recaps)await expect(archive.locator(`img[src*="${row.id}"]`)).toHaveCount(1);
    await page.getByRole('combobox',{name:/^Week/}).selectOption('7');
    await page.getByLabel('Coverage',{exact:false}).selectOption('');
    await expect(archive.getByRole('status')).toContainText('Week 7 · 12 videos');
    await expect(archive.getByRole('button',{name:/^Watch /})).toHaveCount(12);
  });
}


for(const standalone of [false,true])test(`article masthead stays visible through the final paragraph: ${standalone?'standalone':'browser'}`,async({page},testInfo)=>{
 const mobile=page.viewportSize().width<=760;
 test.skip(standalone&&!mobile,'Installed shell is a mobile contract.');
 if(standalone)await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 if(mobile){
  await page.goto('/');
  const recent=page.locator('[aria-label="Recent stories"]');
  await expect(recent).toBeVisible();
  await recent.evaluate(el=>{const owner=document.scrollingElement;owner.scrollTo({top:owner.scrollTop+el.getBoundingClientRect().top+60,behavior:'instant'});});
  const wordmark=page.locator('.mobileBriefLogo');
  await expect(wordmark).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(wordmark).toHaveCSS('border-radius','0px');
  await expect(wordmark).toHaveCSS('backdrop-filter','none');
  await testInfo.attach('home-photo-unboxed-wordmark',{body:await page.screenshot(),contentType:'image/png'});
 }
 await page.goto('/articles/hollis-chargers-thought-of-everything');
 await expect(page.locator('html')).toHaveAttribute('data-app-tab','detail');
 const header=page.locator(mobile?'.appSectionHeader':'.siteNav');
 const logo=mobile?header.locator('.mobileBriefLogo'):header.locator('a').first();
 for(const fraction of [.25,.6,1]){
  await page.evaluate(({standalone,fraction})=>{const owner=document.scrollingElement;owner.scrollTo({top:(owner.scrollHeight-owner.clientHeight)*fraction,behavior:'instant'});},{standalone,fraction});
  await expect.poll(()=>header.evaluate(e=>Math.abs(e.getBoundingClientRect().top))).toBeLessThanOrEqual(1);
  await expect(logo).toBeVisible();
  expect(await logo.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));})).toBe(true);
  if(mobile){
   await expect(header).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
   await expect(logo).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
   await expect(logo).toHaveCSS('border-radius','0px');
   await expect(logo).toHaveCSS('backdrop-filter','none');
   expect((await logo.boundingBox()).width).toBeLessThan(page.viewportSize().width*.7);
  }
  await testInfo.attach(`article-header-${fraction}`,{body:await page.screenshot(),contentType:'image/png'});
 }
});

for(const root of ['', '/sunday-crew', '/doge'])test(`Week 9 real media plays and all six originals load: ${root||'LOOG'}`,async({page},testInfo)=>{
 const mobile=page.viewportSize().width<=760;
 if(mobile)await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 const edition=root.slice(1)||'loog';
 const rows=data('week9-approved-homepage-media.json').filter(r=>r.edition===edition);
 expect(rows).toHaveLength(6);
 // No media mocks: exercise the current shelf, browser decoder and packaged URLs.
 expect((await page.goto(root||'/')).status()).toBe(200);
 const shelf=page.getByRole('region',{name:'Week 9, the previews. videos'});
 const opener=shelf.getByRole('button',{name:/^Watch /}).first();
 await opener.scrollIntoViewIfNeeded();const beforeClick=await opener.evaluate(e=>e.getBoundingClientRect().top);
 await opener.evaluate(e=>e.addEventListener('click',()=>{window.__qaReelClickTop=e.getBoundingClientRect().top},{capture:true,once:true}));
 await opener.click();const anchor=await page.evaluate(()=>window.__qaReelClickTop);
 const player=page.getByRole('dialog').locator('video:not([aria-hidden="true"])');
 await expect(player).toHaveCount(1);
 try{await expect.poll(()=>player.evaluate(v=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);}
 catch(error){
  const state=await page.getByRole('dialog').locator('video').evaluateAll(videos=>videos.map(v=>({hidden:v.getAttribute('aria-hidden'),paused:v.paused,readyState:v.readyState,networkState:v.networkState,currentTime:v.currentTime,currentSrc:v.currentSrc,muted:v.muted,error:v.error?{code:v.error.code,message:v.error.message}:null,buffered:Array.from({length:v.buffered.length},(_,i)=>[v.buffered.start(i),v.buffered.end(i)])})));
  await testInfo.attach('real-media-failure-state',{body:JSON.stringify(state,null,2),contentType:'application/json'});
  throw error;
 }
 expect(await player.evaluate(v=>v.currentSrc)).toContain(rows[0].id);
 expect(await player.evaluate(v=>!v.muted&&v.volume>0)).toBe(true);
 await page.getByRole('button',{name:'Close video',exact:true}).click();
 const returnedTop=await opener.evaluate(e=>e.getBoundingClientRect().top);
 expect(Math.abs(returnedTop-anchor),JSON.stringify({beforeClick,openingClick:anchor,returnedTop})).toBeLessThan(3);
 expect(await page.evaluate(()=>document.documentElement.style.overflow!=='hidden'&&document.body.style.overflow!=='hidden')).toBe(true);
 const nav=page.getByRole('navigation',{name:mobile?'App navigation':'Primary navigation',exact:true});
 await expect(nav).toBeVisible();
 const expectLanded=async id=>{
  await expect(page).toHaveURL(new RegExp('#'+id+'$'));
  // Use the same real header boundary as the dedicated section-navigation contract.
  await expect.poll(()=>page.locator('#'+id).evaluate((target,mobile)=>{
   const header=document.querySelector(mobile?'.appSectionHeader':'.siteNav');
   const offset=mobile?0:16+(parseFloat(getComputedStyle(target).scrollMarginTop)||0);
   const top=target.getBoundingClientRect().top;
   if(top<0||top>=innerHeight)return Number.POSITIVE_INFINITY;
   return Math.abs(top-header.getBoundingClientRect().bottom-offset);
  },mobile)).toBeLessThanOrEqual(1);
 };
 await nav.getByRole('link',{name:/^scores$/i}).click();await expectLanded('scores');
 await expect(page.locator('.appScrollContent')).toHaveCount(0);
 await page.evaluate(()=>window.scrollBy(0,300));await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
 await expect(nav).toBeVisible();
 // Edition desktop headers expose The League; mobile and global desktop expose Culture.
 const second=mobile||!root?'culture':'league';
 await nav.getByRole('link',{name:second==='culture'?/^culture$/i:/^the league$/i}).click();
 await expectLanded(second);
 await expect(nav).toBeVisible();
 for(const row of rows){
  const observed=await page.evaluate(({id})=>new Promise((resolve,reject)=>{
   const v=document.createElement('video');v.preload='metadata';v.muted=true;v.playsInline=true;
   const cleanup=()=>{clearTimeout(timer);v.removeAttribute('src');v.load();v.remove();};
   const timer=setTimeout(()=>{cleanup();reject(Error('Real MP4 metadata timed out: '+id));},15000);
   v.onloadedmetadata=()=>{const result={duration:v.duration,width:v.videoWidth,height:v.videoHeight};cleanup();resolve(result);};
   v.onerror=()=>{const code=v.error?.code;cleanup();reject(Error('Real MP4 decode error '+code+': '+id));};
   document.body.append(v);v.src='/reels/'+id+'.mp4';
  }),{id:row.id});
  expect(Math.abs(observed.duration-row.durationSeconds)).toBeLessThan(.2);
  expect(observed.width).toBeGreaterThan(0);expect(observed.height).toBeGreaterThan(observed.width);
 }
});
