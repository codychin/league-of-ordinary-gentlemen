import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const columns=JSON.parse(fs.readFileSync(new URL('../../data/week9-matchup-columns.json',import.meta.url)));
const slugs={1:'kupp-doubs',2:'danir',3:'all-ugly',4:'route-22',5:'skatt',6:'pollard-greens',7:'hopkins-opus',8:'shake-baker',9:'kraft',10:'royrek',11:'lloyd-rings',12:'ceedeep'};
for(const edition of ['loog','sunday-crew','doge'])test(`${edition} all six current written previews render exact text without cross-pair leakage`,async({page})=>{
 test.setTimeout(180000);
 for(const c of columns.filter(c=>c.edition===edition)){
  const path=edition==='loog'?`/matchups/${slugs[c.teamIds[0]]}/${slugs[c.teamIds[1]]}`:`/${edition}/matchups/${c.teamIds.join('/')}`;
  await page.goto(path,{waitUntil:'domcontentloaded'});
  const column=page.locator('.matchupColumn');
  await expect(column.locator('h2')).toHaveText(c.headline);
  const ps=column.locator('p:not(.matchupUpdated)');
  await expect(ps).toHaveText(c.body.split(/\n\n+/));
  await expect(column).toContainText('UPDATED NOVEMBER 7');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
});
