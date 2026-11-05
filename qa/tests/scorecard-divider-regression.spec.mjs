import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';

// Deterministic visual contract for the shared scorecard CSS. A transparent
// portrait silhouette ends at its intrinsic baseline; unlike the old image-box
// assertion, this checks the rendered pixels immediately above the CTA divider.
const portrait='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="25" r="24"/><path d="M0 100 Q0 53 50 53 Q100 53 100 100Z"/></svg>');
const css=await Promise.all(['globals','pwa'].map(name=>readFile(`app/${name}.css`,'utf8')));
async function baselinePixels(page){
 const row=page.locator('.briefMatchupPortraits'), divider=page.locator('.briefMatchupOpen');
 const r=await row.boundingBox(), d=await divider.boundingBox();
 const buffer=await page.screenshot({clip:{x:r.x,y:d.y-2,width:r.width,height:2},scale:'css'});
 const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
 return [0,1].map(side=>{
  let ink=0;
  for(let y=0;y<info.height;y++)for(let x=Math.floor(side*info.width/2);x<Math.floor((side+1)*info.width/2);x++){
   const i=(y*info.width+x)*info.channels;if(data[i]<70&&data[i+1]<70&&data[i+2]<70)ink++;
  }
  return ink;
 });
}

// Use real route markup and available player portraits as well as the deterministic
// pixel negative control above. The QA server's LOOG completed-week snapshot is labelled;
// images are neither generated nor substituted. Other editions use their data.
for(const root of ['','/sunday-crew','/doge']){
 test(`real edition portraits remain uncropped at divider: ${root||'LOOG'}`,async({page},testInfo)=>{
  if(!root)testInfo.annotations.push({type:'fixture',description:'The existing QA-only server preload pins LOOG scores to the committed completed week; player image responses are real.'});
  expect((await page.goto((root||'/')+'?app-preview=1&tab=scores')).status()).toBe(200);
  const card=page.locator('.briefMatchupCard').filter({has:page.locator('.briefMatchupPortraits img')}).first();
  await expect(card).toBeVisible();await card.scrollIntoViewIfNeeded();
  const photos=card.locator('.briefMatchupPortraits img');
  await expect(photos).toHaveCount(2);
  await photos.evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  const geometry=await card.evaluate(c=>{
   const row=c.querySelector('.briefMatchupPortraits').getBoundingClientRect(),d=c.querySelector('.briefMatchupOpen').getBoundingClientRect();
   return {gap:d.top-row.bottom,photos:[...c.querySelectorAll('.briefMatchupPortraits img')].map(i=>({src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight,fit:getComputedStyle(i).objectFit,position:getComputedStyle(i).objectPosition,bottom:i.getBoundingClientRect().bottom-row.bottom,background:getComputedStyle(i).backgroundColor,backgroundImage:getComputedStyle(i).backgroundImage}))};
  });
  expect(Math.abs(geometry.gap)).toBeLessThanOrEqual(1);
  for(const p of geometry.photos){expect(p.width).toBeGreaterThan(0);expect(p.height).toBeGreaterThan(0);expect(p.fit).toBe('contain');expect(p.position).toBe('50% 100%');expect(Math.abs(p.bottom)).toBeLessThanOrEqual(1);expect(p.background).toBe('rgba(0, 0, 0, 0)');expect(p.backgroundImage).toBe('none');}
  await testInfo.attach('actual-portrait-geometry',{body:JSON.stringify(geometry,null,2),contentType:'application/json'});
  await testInfo.attach('actual-portraits-after',{body:await card.screenshot(),contentType:'image/png'});
  await card.locator('.briefMatchupOpen').evaluate(e=>e.style.marginTop='14px');
  await testInfo.attach('actual-portraits-original-gap-control',{body:await card.screenshot(),contentType:'image/png'});
 });
}
for(const standalone of [false,true]){
 test(`shared Scores divider touches visible portraits; standalone=${standalone}`,async({page})=>{
  await page.setContent(`<html class="${standalone?'standaloneApp':''}" data-app-tab="scores"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css.join('\n')}</style></head><body><main><section id="scores" class="section scoreSection"><article class="briefMatchupCard"><div class="briefMatchupTeams"><div class="briefMatchupSide"><b>CeeDeep Shaheeded Rivalry with a long franchise name</b><strong>123.45</strong></div><i>VS</i><div class="briefMatchupSide briefMatchupRight"><b>DarkHorse Danir</b><strong>132.45</strong></div></div><div class="briefMatchupPortraits"><img src="${portrait}"><img src="${portrait}" class="briefMatchupRightPlayer"></div><span class="briefMatchupOpen">Matchup →</span></article></section></main></body></html>`);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  for(const ink of await baselinePixels(page))expect(ink,'visible shoulder pixels must reach divider').toBeGreaterThan(8);
  const geometry=await page.locator('img').first().evaluate(i=>({fit:getComputedStyle(i).objectFit,position:getComputedStyle(i).objectPosition}));
  expect(geometry).toEqual({fit:'contain',position:'50% 100%'});
  // Negative control: the exact original Scores rule must leave a blank strip.
  await page.locator('.briefMatchupOpen').evaluate(e=>e.style.marginTop='14px');
  expect(await baselinePixels(page)).toEqual([0,0]);
 });
}

// Long identities are an intentional stress fixture for the shared detail layout,
// exercised in both web and installed-app shells at the two narrowest supported widths.
const matchupCss=await readFile('app/matchups.css','utf8');
for(const width of [320,375]) for(const standalone of [false,true]){
 test(`matchup names stay outside VS; width=${width}, standalone=${standalone}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:900});
  await page.setContent(`<html class="${standalone?'standaloneApp':''}" data-app-tab="scores"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css.join('\n')}\n${matchupCss}</style></head><body><main class="matchupPage"><section class="matchupLead"><div class="matchupScoreboard"><a class="matchupHeroSide"><small>Max Levene</small><h1>Royrek Tishmeshulam</h1><b>123.45</b><span>PREGAME</span></a><div class="matchupHeroCenter"><span>VS</span><small>WEEK 9</small></div><a class="matchupHeroSide right"><small>Jordan Katz + Brandon Katz</small><h1>Wake Me Up On September 1st</h1><b>234.56</b><span>PREGAME</span></a></div><p class="matchupUpdated">LINEUP SNAPSHOT • Nov 5, 2026, 8:05 AM EST</p></section></main></body></html>`);
  const geometry=await page.locator('.matchupScoreboard').evaluate(e=>{
   const center=e.querySelector('.matchupHeroCenter').getBoundingClientRect();
   const names=[...e.querySelectorAll('h1')].map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,scroll:n.scrollWidth,width:n.clientWidth};});
   const scores=[...e.querySelectorAll('.matchupHeroSide b')].map(n=>n.getBoundingClientRect().top);
   return {names,center:{left:center.left,right:center.right},scores,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect(geometry.overflow).toBe(false);
  expect(geometry.names[0].right).toBeLessThanOrEqual(geometry.center.left);
  expect(geometry.names[1].left).toBeGreaterThanOrEqual(geometry.center.right);
  for(const n of geometry.names){expect(n.scroll).toBeLessThanOrEqual(n.width+1);expect(n.bottom).toBeLessThanOrEqual(geometry.scores[0]);}
  expect(Math.abs(geometry.scores[0]-geometry.scores[1])).toBeLessThanOrEqual(1);
  await expect(page.locator('.matchupUpdated')).toHaveCSS('font-size','10px');
  await expect(page.locator('.matchupUpdated')).toContainText('EST');
  await testInfo.attach('mobile-matchup-layout',{body:await page.screenshot(),contentType:'image/png'});
 });
}
