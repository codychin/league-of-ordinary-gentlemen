import {test,expect} from '../helpers/browser.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const snapshot=readFileSync(new URL('../../drafts/baker-abstention-snapshot.md',import.meta.url),'utf8');
const plain=p=>p.replace(/\*([^*]+)\*/g,'$1').replace(/\[([^\]]+)\]\(https:\/\/[^)]+\)/g,'$1');
const paragraphs=snapshot.split('---',3)[2].trim().split('\n\n').map(plain);
paragraphs[0]='Baker Mayfield played an entire NFL game on Sunday, attempted three passes, completed none, and finished with zero passing yards.';
const additions=readFileSync(new URL('../../drafts/baker-abstention-approved-additions.md',import.meta.url),'utf8').trim().split('\n\n');
paragraphs.splice(paragraphs.indexOf('A surprise ending.')+1,0,...additions);
const path='/articles/maude-baker-comparative-merits-of-abstention';

test('Baker preservation route retains exact approved copy and inline formatting',async({page})=>{
 expect(createHash('sha256').update(snapshot).digest('hex')).toBe('3b5b89384958ff874989f43b02c7c6ae25486ea44bbe2d91f02c766633641c07');
 expect(paragraphs).toHaveLength(29);
 expect((await page.goto(path)).status()).toBe(200);
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('h1')).toHaveText('Baker Mayfield and the Comparative Merits of Abstention');
 await expect(page.locator('.articleDek')).toHaveText('An afternoon that satisfied the league’s scheduling requirements.');
 await expect(page.locator('.bylineWriter strong')).toHaveText('By Maude Gannon');
 expect(await page.locator('.articleBody > p').allTextContents()).toEqual(paragraphs);
 await expect(page.locator('.articleBody em')).toHaveText('passer');
 await expect(page.getByRole('link',{name:'Scott Smith’s account for the Buccaneers'})).toHaveAttribute('href','https://www.buccaneers.com/news/falcons-bucs-week-8-recap-postgame-report-2026');
 await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
 await expect(page.locator('.eyebrow')).toHaveText('FOOTBALL • STRATEGY & BAD PROCESS');
 await expect(page.locator('h1')).toHaveCSS('font-family',/Brief Nine F Native Preview/);
 await expect(page.locator('.articleBody > p').first()).toHaveCSS('font-family',/Brief Body Reference 5/);
 await expect(page.locator('.articleDek')).toHaveCSS('font-style','italic');
 expect(await page.locator('main').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(false);
 await expectGamePhoto(page.locator('.articleImage'));
 await expect(page.locator('figcaption')).toHaveCount(0);
 for(const route of ['/archive']){
  await page.goto(route);
  await expect(page.locator(`a[href="${path}"]`)).toHaveCount(1);
 }
});

async function expectGamePhoto(img){
 await expect(img).toBeVisible();
 await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 const geometry=await img.evaluate(i=>{const r=i.getBoundingClientRect();return {ratio:r.width/r.height,natural:i.naturalWidth/i.naturalHeight,fit:getComputedStyle(i).objectFit,source:i.currentSrc}});
 expect(geometry.ratio).toBeCloseTo(1.5,2);
 expect(Math.abs(geometry.ratio/geometry.natural-1)).toBeLessThan(.005);
 expect(geometry.fit).toBe('contain');
 expect(geometry.source).toMatch(/\/images\/(cache|editorial\/baker-abstention)\//);
}
const orderedSlugs=['hollis-chargers-thought-of-everything','maude-baker-comparative-merits-of-abstention','marnie-detroit-school','maude-saturation-bombing-daniel-jones','conrad-allow-me-to-reintroduce-myself','marnie-delicate-etiquette-sporting-pat','conrad-jalen-hurts-too-sick-to-sleep','hollis-rams-kicker-weight','maude-nfc-east-declines-winner','sabine-and-you-are','marnie-marvin-harrison-somewhere-else','marnie-hecklinski-use-your-words','marnie-time-traveling-goblin-paradox','conrad-tomlin-minecraft-cvs','marnie-corgi-he-wanted-them-to-know'];
for(const root of ['', '/doge','/sunday-crew'])for(const scheme of ['light','dark'])test(`Chargers shared hero preserves design and chronology ${root||'loog'} ${scheme}`,async({page})=>{
 await page.emulateMedia({colorScheme:scheme});
 await page.goto(root||'/');
 const headings=page.locator('main > .immersiveLead h2, [aria-label="Recent stories"] h3, main > .hero.heroStack h2, .mobileLowerCarousel h2, .mobileStoryRows h2');
 const paths=await headings.evaluateAll(nodes=>nodes.map(n=>n.closest('a').getAttribute('href')));
 expect(paths).toEqual(orderedSlugs.map(slug=>`${root}/articles/${slug}`));
 expect(new Set(paths).size).toBe(15);
 await expect(page.locator('[aria-label="Recent stories"] > article')).toHaveCount(3);
 await expect(page.locator('.immersiveLead h2')).toHaveText('The Chargers Have Thought of Everything');
 const hero=page.locator('.immersiveLead');
 const img=hero.locator('.sundayFeatureImage img');
 await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 await expect(img).toHaveCSS('object-fit','cover');
 const geometry=await hero.evaluate(h=>{
  const frame=h.querySelector('.sundayFeatureImage'), title=h.querySelector('h2');
  const f=frame.getBoundingClientRect(),t=title.getBoundingClientRect(),fade=getComputedStyle(frame,'::after');
  return {frame:{x:f.x,y:f.y,width:f.width,height:f.height,bottom:f.bottom},title:{x:t.x,y:t.y,right:t.right,bottom:t.bottom},position:getComputedStyle(frame).position,fade:fade.backgroundImage,fadeDisplay:fade.display,figureCount:h.querySelectorAll('figure').length};
 });
 expect(geometry.figureCount).toBe(0);
 expect(geometry.fade).toContain('linear-gradient');
 expect(geometry.fadeDisplay).not.toBe('none');
 expect(geometry.title.y).toBeLessThan(geometry.frame.bottom);
 expect(geometry.title.right).toBeGreaterThan(geometry.frame.x);
 if(page.viewportSize().width>760){
  expect(geometry.position).toBe('absolute');
  expect(geometry.frame.width).toBeLessThanOrEqual(780);
 }else{
  expect(geometry.frame.height).toBeGreaterThanOrEqual(340);
  expect(geometry.frame.height).toBeLessThanOrEqual(480);
 }
 await expect(hero.locator('[class*="heroCredit"]')).toHaveCount(0);
 await page.locator('.immersiveLead h2').click();
 await expect(page).toHaveURL(new RegExp(`${root}/articles/hollis-chargers-thought-of-everything$`));
 await expect(page.locator('h1')).toHaveText('The Chargers Have Thought of Everything');
 await expect(page.locator('.articleBody > p').last()).toHaveText('McDaniel has some nerve telling us life is short.');
 await expect(page.locator('.articleBody')).toContainText('In an episode called');
 await expect(page.locator('.articleBody')).toContainText('At this point, the investigation must finally confront the inevitability of Madison Beer.');
 await expect(page.locator('.articleBody')).not.toContainText('In a 1978 episode called');
 await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
 await expectGamePhoto(page.locator('.articleImage'));
 await expect(page.locator('.articleImageCredit')).toContainText('Joe Glorioso');
 // A traced X iframe defect is reported separately from application JS errors.
 // Every requested embed must still provide a visible widget or its usable
 // original-clip fallback. This tests delivery, not third-party video playback.
 const clips=page.locator('.articleBody > figure');
 await expect(clips).toHaveCount(11);
 for(const clip of await clips.all()){
  await expect.poll(async()=>{
   const frame=clip.locator('iframe');
   if(await frame.count() && await frame.first().isVisible())return true;
   const fallback=clip.getByRole('link',{name:'Watch the original clip on X →'});
   return await fallback.count()===1 && await fallback.isVisible() && /^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(await fallback.getAttribute('href')||'');
  },{message:'Each X clip has a visible embed or a verified original-link fallback'}).toBe(true);
 }

 await expect(page.locator('a.back')).toHaveAttribute('href',root||'/');
});
