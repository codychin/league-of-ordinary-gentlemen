import {test,expect} from '../helpers/browser.mjs';
import {readFileSync} from 'node:fs';
import {leagueSnapshot} from '../../app/teams/league-data.js';
const scores=JSON.parse(readFileSync(new URL('../../data/latest-loog-scores.json',import.meta.url)));
const teamSlug=id=>Object.keys(leagueSnapshot.teams).find(s=>leagueSnapshot.teams[s].teamId===id);
const g=scores.matchups[0];
const paths=[`/matchups/${teamSlug(g.home.id)}/${teamSlug(g.away.id)}`,'/doge/matchups/1/2','/sunday-crew/matchups/1/2'];
function contrast(a,b){const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('system theme updates mobile glass navigation and all three matchup templates',async({page},info)=>{
 test.skip(page.viewportSize().width>760,'Mobile theme scope');
 info.annotations.push({type:'fixture',description:'Requires explicit qa/fixtures/dark-matchups.cjs server preload. LOOG committed score snapshot; labelled synthetic Yahoo layout data. Not live provider verification.'});
 for(const [index,path] of paths.entries()){
  await page.emulateMedia({colorScheme:'light'});expect((await page.goto(path)).status()).toBe(200);
  await expect(page.locator('.matchupColumn')).toBeVisible();
  const nav=page.getByRole('navigation',{name:'App navigation'});
  const light=await nav.evaluate(e=>getComputedStyle(e).backgroundImage);
  await page.emulateMedia({colorScheme:'dark'});
  await expect(nav).toHaveCSS('border-top-color','rgb(130, 125, 115)');
  expect(await nav.evaluate(e=>getComputedStyle(e).backgroundImage)).not.toBe(light);
  await expect(page.locator('main.matchupPage')).toHaveCSS('background-color','rgb(13, 12, 11)');
  for(const selector of ['.matchupColumn p','.matchupHeroSide small','.matchupColumnByline small','.lineupPlayer b','.matchupUpdated']){
   for(const e of await page.locator(selector).all())if(await e.isVisible()){
    const color=await e.evaluate(e=>getComputedStyle(e).color);
    expect(contrast(color,'rgb(13,12,11)'),`${path} ${selector} ${color}`).toBeGreaterThanOrEqual(4.5);
   }
  }
  const inactive=nav.locator('a').first();
  expect(contrast(await inactive.evaluate(e=>getComputedStyle(e).color),'rgb(47,45,40)')).toBeGreaterThanOrEqual(3);
  await nav.getByRole('button',{name:'More',exact:true}).click();
  const sheet=page.locator('.appMoreSheet');await expect(sheet).toBeVisible();
  for(const link of await sheet.locator('a').all())expect(contrast(await link.evaluate(e=>getComputedStyle(e).color),'rgb(13,12,11)')).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({path:`/workspace/font-qa/dark-matchup-${index}-${page.viewportSize().width}.png`});
  await nav.getByRole('button',{name:'More',exact:true}).click();
  await page.screenshot({path:`/workspace/font-qa/dark-matchup-content-${index}-${page.viewportSize().width}.png`,fullPage:true});
  await page.emulateMedia({colorScheme:'light'});await expect(nav).toHaveCSS('background-image',light);
  await expect(page.locator('.matchupColumn p').first()).toHaveCSS('color','rgb(63, 58, 52)');
 }
});

test('Culture paper foreground remains readable on desktop and mobile',async({page})=>{
 await page.goto('/#culture');
 const title=page.locator('#culture .cultureGrid .card h3').first();
 const colors=await title.evaluate(e=>({foreground:getComputedStyle(e).color,fill:getComputedStyle(e).webkitTextFillColor,background:getComputedStyle(e.closest('#culture')).backgroundColor}));
 expect(colors.fill).toBe(colors.foreground);expect(contrast(colors.foreground,colors.background)).toBeGreaterThanOrEqual(4.5);
 await page.screenshot({path:`/workspace/font-qa/culture-contrast-${page.viewportSize().width}.png`});
});
