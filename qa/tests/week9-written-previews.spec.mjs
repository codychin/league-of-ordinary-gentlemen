import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {renderMatchupColumn,slugs} from '../fixtures/render-matchup-column.mjs';
const columns=JSON.parse(fs.readFileSync(new URL('../../data/week9-matchup-columns.json',import.meta.url)));
const recaps=JSON.parse(fs.readFileSync(new URL('../../data/matchup-recaps.json',import.meta.url)));
const awaiting='The result is final. The correspondent recap is awaiting publication.';
const matches=(c,edition,week,ids)=>c.edition===edition&&Number(c.week)===week&&Number(c.season??2026)===2026&&c.teamIds.length===2&&ids.every(id=>c.teamIds.map(String).includes(String(id)));
async function assertColumn(page,expected,{final=false}={}){
 const column=page.locator('.matchupColumn');
 await expect(column.locator('h2')).toHaveText(expected?.headline??'Awaiting correspondent recap');
 await expect(column.locator('p:not(.matchupUpdated)')).toHaveText((expected?.body??awaiting).split(/\n\n+/));
 if(final){
  await expect(page.locator('.matchupHeroSide span')).toHaveText(['FINAL','FINAL']);
  await expect(column).not.toContainText('CORRESPONDENT PREVIEW');
 }else await expect(column).toContainText('CORRESPONDENT PREVIEW');
 if(expected?.sourceAsOf)await expect(column).toContainText('UPDATED NOVEMBER 7');
}
for(const edition of ['loog','sunday-crew','doge']){
 test(`${edition} all six actual routes show exact phase-appropriate columns without cross-pair leakage`,async({page})=>{
  test.setTimeout(180000);
  const pairs=columns.filter(c=>c.edition===edition);expect(pairs).toHaveLength(6);
  for(const c of pairs){
   const path=edition==='loog'?`/matchups/${slugs[c.teamIds[0]]}/${slugs[c.teamIds[1]]}`:`/${edition}/matchups/${c.teamIds.join('/')}`;
   await page.goto(path,{waitUntil:'domcontentloaded'});
   // Derive state from the scoreboard, never from a missing/changed headline.
   const kicker=await page.locator('.matchupHeroKicker').innerText();
   expect(kicker).toMatch(/WEEK 9\b/);
   const phases=await page.locator('.matchupHeroSide span').allTextContents();
   expect(phases).toHaveLength(2);expect(phases[0]).toBe(phases[1]);
   expect(['FINAL','PREGAME','LIVE','IN PROGRESS','AWAITING PROVIDER FINAL']).toContain(phases[0]);
   const final=phases[0]==='FINAL';
   const expected=final?recaps.find(r=>r.kind==='recap'&&matches(r,edition,9,c.teamIds)):c;
   await assertColumn(page,expected,{final});
   if(final)await expect(page.locator('.matchupColumn h2')).not.toHaveText(c.headline);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
 });
 test(`${edition} actual components preserve all six pregame columns and both final states`,async({page},info)=>{
  test.setTimeout(180000);
  info.annotations.push({type:'fixture',description:'QA-only dependency snapshots render unchanged production matchup components. This complements, not replaces, the unmocked route test.'});
  for(const c of columns.filter(c=>c.edition===edition)){
   await page.setContent(await renderMatchupColumn(c));
   await assertColumn(page,c);
   await page.setContent(await renderMatchupColumn(c,{final:true}));
   await assertColumn(page,null,{final:true});
   await expect(page.locator('.matchupColumn h2')).not.toHaveText(c.headline);
   const recap={...c,kind:'recap',sourceAsOf:null,headline:`QA FINAL ${edition} ${c.teamIds.join('/')}`,body:'QA-only final recap first paragraph.\n\nQA-only final recap second paragraph.'};
   await page.setContent(await renderMatchupColumn(c,{final:true,recaps:[recap]}));
   await assertColumn(page,recap,{final:true});
  }
 });
}
