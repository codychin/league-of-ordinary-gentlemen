import {test,expect} from '../helpers/browser.mjs';
import {readFileSync} from 'node:fs';
test.beforeEach(async({page})=>{await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));});
import {leagueSnapshot} from '../../app/teams/league-data.js';
const scores=JSON.parse(readFileSync(new URL('../../data/latest-loog-scores.json',import.meta.url)));
const teamSlug=id=>Object.keys(leagueSnapshot.teams).find(s=>leagueSnapshot.teams[s].teamId===id);
const g=scores.matchups[0];
const paths=[`/matchups/${teamSlug(g.home.id)}/${teamSlug(g.away.id)}`,'/doge/matchups/1/2','/sunday-crew/matchups/1/2'];
function contrast(a,b){const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('mobile web stays light through system appearance changes on all three matchup templates',async({page},info)=>{
 test.skip(page.viewportSize().width>760,'Mobile-only appearance decision');
 info.annotations.push({type:'fixture',description:'Explicit qa/fixtures/dark-matchups.cjs server preload: LOOG committed scores, synthetic Yahoo layout records. Not live provider verification.'});
 for(const [index,path] of paths.entries()){
  await page.emulateMedia({colorScheme:'light'});expect((await page.goto(path)).status()).toBe(200);await expect(page.locator('.matchupColumn')).toBeVisible();
  const nav=page.getByRole('navigation',{name:'App navigation'});const surface=await nav.evaluate(e=>getComputedStyle(e).backgroundImage);
  await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveCSS('color-scheme','light only');
  await expect(nav).toHaveCSS('background-image',surface);await expect(page.locator('main.matchupPage')).toHaveCSS('background-color','rgb(245, 241, 232)');
  for(const selector of ['.matchupColumn p','.matchupHeroSide small','.matchupColumnByline small','.lineupPlayer b','.matchupUpdated'])for(const el of await page.locator(selector).all())if(await el.isVisible())expect(contrast(await el.evaluate(e=>getComputedStyle(e).color),'rgb(245,241,232)'),selector).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({path:`/workspace/font-qa/light-only-matchup-${index}-${page.viewportSize().width}.png`,fullPage:true,animations:'disabled'});
 }
});
test('light-only Home, Culture, Crates and reader retain controls and no preview top rule',async({page})=>{
 test.skip(page.viewportSize().width>760,'Mobile-only appearance decision');await page.emulateMedia({colorScheme:'dark'});await page.goto('/');
 await expect(page.locator('meta[name="theme-color"][media="(max-width:760px)"]')).toHaveAttribute('content','#f5f1e8');
 await expect(page.locator('section[aria-label$=" videos"]').first()).toHaveCSS('border-top-width','0px');
 const category=page.locator('.sabinePackageIntro > small').first();await expect(category).toHaveCSS('color','rgb(164, 61, 49)');
 const nav=page.getByRole('navigation',{name:'App navigation'});await expect(nav.locator('a').first()).toHaveCSS('color','rgb(164, 61, 49)');
 await page.screenshot({path:`/workspace/font-qa/light-only-home-${page.viewportSize().width}.png`,animations:'disabled'});
 const link=page.getByRole('link',{name:'DIG INTO THE CRATES'});await link.scrollIntoViewIfNeeded();await expect(link).toHaveCSS('font-size','16px');await expect(link).toHaveCSS('line-height','22px');expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(48);await expect(link.locator('svg')).toBeVisible();
 await page.screenshot({path:`/workspace/font-qa/light-only-crates-link-${page.viewportSize().width}.png`,animations:'disabled'});
 await link.click();await expect(page).toHaveURL(/\/archive$/);await expect(page.locator('main')).toHaveCSS('background-color','rgb(245, 241, 232)');await expect(page.locator('.editorialCategory').first()).toHaveCSS('color','rgb(164, 61, 49)');
 await page.screenshot({path:`/workspace/font-qa/light-only-crates-${page.viewportSize().width}.png`,animations:'disabled'});
 await page.goto('/articles/marnie-detroit-school');await expect(page.locator('main')).toHaveCSS('background-color','rgb(245, 241, 232)');await expect(page.locator('.articleBody p').first()).toHaveCSS('color','rgb(38, 36, 31)');await expect(page.locator('.articleDek')).toHaveCSS('font-style','italic');
 await expect(page.locator('.bylineWriter img')).toBeVisible();await expect(page.getByRole('button',{name:'Share this article'})).toHaveCSS('color','rgb(164, 61, 49)');
 await page.screenshot({path:`/workspace/font-qa/light-only-reader-${page.viewportSize().width}.png`,animations:'disabled'});
});
test('Culture foreground remains readable on its light editorial surface',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/#culture');const title=page.locator('#culture .cultureGrid .card h3').first();const colors=await title.evaluate(e=>({foreground:getComputedStyle(e).color,fill:getComputedStyle(e).webkitTextFillColor,background:getComputedStyle(e.closest('#culture')).backgroundColor}));expect(colors.fill).toBe(colors.foreground);expect(contrast(colors.foreground,colors.background)).toBeGreaterThanOrEqual(4.5);
 await page.screenshot({path:`/workspace/font-qa/light-only-culture-${page.viewportSize().width}.png`,animations:'disabled'});
});
