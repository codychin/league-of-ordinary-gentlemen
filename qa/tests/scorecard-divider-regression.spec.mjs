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
