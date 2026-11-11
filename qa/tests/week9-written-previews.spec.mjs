import {test,expect} from '@playwright/test';
import {renderMatchupColumn} from '../fixtures/render-matchup-column.mjs';
import {week9Columns,recapFor,matchupPath,renderWeek9Matchup} from '../fixtures/week9-matchup-render.mjs';

async function assertColumn(page,c,phase){
 const column=page.locator('.matchupColumn');
 const selected=phase==='pregame'?c:recapFor(c);
 await expect(column.locator('h2')).toHaveText(selected?.headline||'Awaiting correspondent recap');
 await expect(column.locator('p:not(.matchupUpdated)')).toHaveText((selected?.body||'The result is final. The correspondent recap is awaiting publication.').split(/\n\n+/));
 if(phase==='pregame'){
  await expect(column).toContainText('UPDATED NOVEMBER 7');
  await expect(column.locator('.matchupColumnByline')).toContainText('CORRESPONDENT PREVIEW');
 }else{
  await expect(page.locator('.matchupHeroSide > span')).toHaveText(['FINAL','FINAL']);
  await expect(column).not.toContainText('CORRESPONDENT PREVIEW');
  await expect(column).not.toContainText(c.headline);
  await expect(column).not.toContainText(c.body.split(/\n\n+/)[0]);
  if(!selected)await expect(column).not.toContainText('UPDATED NOVEMBER 7');
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}

// Deterministic phase coverage renders the actual matchup components. Navigation,
// hydration and provider access are not claimed by this isolated fixture lane.
for(const phase of ['pregame','final'])for(const edition of ['loog','sunday-crew','doge'])test(`${edition} Week 9 ${phase} component fixture renders all six exact columns without cross-pair leakage`,async({page,baseURL})=>{
 test.setTimeout(180000);
 const columns=week9Columns.filter(c=>c.edition===edition);expect(columns).toHaveLength(6);
 await page.goto('/',{waitUntil:'domcontentloaded'});
 const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>link.outerHTML).join(''));
 expect(styles).not.toBe('');
 for(const c of columns){
  const html=await renderWeek9Matchup(c,phase);
  await page.setContent(`<!doctype html><html><head><base href="${baseURL}/"><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body>${html}</body></html>`);
  await page.evaluate(()=>document.fonts.ready);
  await assertColumn(page,c,phase);
 }
});

// Keep real-route coverage separate. Week 9 is provider-final; pregame copy must
// not be relabelled as a recap or restored just to satisfy an obsolete assertion.
for(const edition of ['loog','sunday-crew','doge'])test(`${edition} Week 9 real routes retain final-only editorial for all six pairings`,async({page})=>{
 test.setTimeout(180000);
 const columns=week9Columns.filter(c=>c.edition===edition);expect(columns).toHaveLength(6);
 for(const c of columns){
  await page.goto(matchupPath(c),{waitUntil:'domcontentloaded'});
  await expect(page.locator('.matchupHeroKicker')).toContainText('WEEK 9');
  await assertColumn(page,c,'final');
 }
});

// Preserve main's independently isolated final-with-recap coverage alongside the
// closeout's styled pregame/final fixtures and strictly final real-route checks.
for(const edition of ['loog','sunday-crew','doge'])test(`${edition} final recap fixture preserves exact approved-pair content`,async({page},info)=>{
 test.setTimeout(180000);
 info.annotations.push({type:'fixture',description:'QA-only recap dependency renders the unchanged production component. This does not claim a published recap.'});
 for(const c of week9Columns.filter(c=>c.edition===edition)){
  const recap={...c,kind:'recap',sourceAsOf:null,headline:`QA FINAL ${edition} ${c.teamIds.join('/')}`,body:'QA-only final recap first paragraph.\n\nQA-only final recap second paragraph.'};
  await page.setContent(await renderMatchupColumn(c,{final:true,recaps:[recap]}));
  const column=page.locator('.matchupColumn');
  await expect(column.locator('h2')).toHaveText(recap.headline);
  await expect(column.locator('p:not(.matchupUpdated)')).toHaveText(recap.body.split(/\n\n+/));
  await expect(page.locator('.matchupHeroSide span')).toHaveText(['FINAL','FINAL']);
  await expect(column).not.toContainText('CORRESPONDENT PREVIEW');
  await expect(column).not.toContainText(c.headline);
 }
});
