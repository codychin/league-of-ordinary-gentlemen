import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chargersArticle as article} from '../app/articles/hollis-chargers-thought-of-everything.js';
const read=p=>readFileSync(p,'utf8');
const slug='hollis-chargers-thought-of-everything';
const expectedLinks=[
  "https://x.com/wokdior/status/2117020743552905692",
  "https://x.com/PolymarketBlitz/status/1952420570836107771",
  "https://x.com/ESPNInsights/status/2117042936831778965",
  "https://x.com/SharpFootball/status/2117743371523629290",
  "https://www.youtube.com/watch?v=gfRIrR8GNIE&t=603",
  "https://www.barstoolsports.com/video/3580559/2-minute-warning-or-the-gruden-family-football-show-week-9",
  "https://x.com/TexansCommenter/status/2118356075510378912",
  "https://www.youtube.com/watch?v=R9maQiL9onk",
  "https://x.com/StBrownPodcast/status/2118045098503966799",
  "https://x.com/ESPNNFL/status/2118393718289924331",
  "https://www.nfl.com/videos/justin-herbert-throws-int-no-2-right-into-ernest-jones-iv-s-hands",
  "https://www.therams.com/video/highlights-rams-trent-mcduffie-catches-interception-justin-herbert-pass-chargers-sofi-stadium",
  "https://x.com/nflnetwork/status/2118118709340627173",
  "https://www.youtube.com/watch?v=Hf-SPMJ0P3Y",
  "https://x.com/NFLonCBS/status/2099262404420853837"
];

test('staged Chargers preserves v8 prose with approved duplicate-link cleanup',()=>{
  assert.equal(article.title,'The Chargers Have Thought of Everything');
  assert.equal(article.author,'crane');
  assert.equal(createHash('sha256').update(JSON.stringify(article.body)).digest('hex'),'6ef60f931c76b973e3edf0f8dc94e92f2b23d30240edf5ddf3c3e630d0aa7154');
  assert.equal(article.body.filter(p=>p?.type==='break').length,2);
  assert.equal(article.body.filter(p=>p?.type==='heading').length,6);
});

test('embedded clips avoid duplicate links and non-embedded sources survive',()=>{
  const links=article.body.filter(p=>p?.type==='rich').map(p=>p.html.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&'));
  assert.deepEqual(links,expectedLinks.filter(url=>!url.startsWith('https://x.com/')&&!url.includes('Hf-SPMJ0P3Y')));
  assert.equal(links.length,5);
  for(const p of article.body.filter(p=>p?.type==='rich')){
    assert.match(p.html,/target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(p.html,/<script|onerror|onclick/i);
  }
  const clips=article.body.filter(p=>p?.type==='xclip');
  assert.equal(clips.length,9);
  assert.deepEqual(clips.map(p=>p.url),expectedLinks.filter(url=>url.startsWith('https://x.com/')));
  for(const clip of clips)assert.ok(clip.url.endsWith('/status/'+clip.id));
  assert.deepEqual(article.body.filter(p=>p?.type==='youtube').map(({id,start})=>[id,start||0]),[
    ['Hf-SPMJ0P3Y',0]
  ]);
  // Chargers-owned YouTube clips prohibit external embedding. Keep their original watch links.
  assert.ok(links.includes('https://www.youtube.com/watch?v=gfRIrR8GNIE&t=603'));
  assert.ok(links.includes('https://www.youtube.com/watch?v=R9maQiL9onk'));
  assert.ok(read('app/components/ArticleClip.jsx').includes('Watch the original clip on X'));
});

test('Chargers review resolves through the shared article renderer in all editions',()=>{
  assert.ok(read('app/articles/data.js').includes("'"+slug+"': chargersArticle"));
  assert.ok(read('lib/editorial-scope.js').includes("'"+slug+"'"));
  assert.ok(read('app/components/editions/Article.js').includes('isGlobalArticle(slug)'));
  assert.ok(!read('app/components/SharedEditorialFront.js').includes(slug));
});


test('Chargers hero keeps verified attribution and locally cached image variants',()=>{
  assert.equal(article.image,'https://upload.wikimedia.org/wikipedia/commons/6/66/Jim_Harbaugh_with_Los_Angeles_Chargers_staffs.jpg');
  assert.match(article.imageAlt,/Jim Harbaugh.*October 5, 2025/);
  assert.equal(article.imageCredit.label,'Joe Glorioso / All-Pro Reels');
  assert.equal(article.imageCredit.licenseUrl,'https://creativecommons.org/licenses/by-sa/4.0/');
  assert.equal(article.imageCredit.licenseLabel,'CC BY-SA 4.0');
  assert.match(article.imageCredit.note,/Resized and display-cropped/);
  const asset=JSON.parse(read('lib/generated/image-manifest.json'))[article.image];
  assert.ok(asset);
  for(const width of [320,640,1280])assert.ok(readFileSync('public'+asset.variants[width]).length>0);
  const renderer=read('app/articles/[slug]/page.js');
  assert.ok(renderer.includes('href={a.imageCredit.licenseUrl}'));
  assert.ok(renderer.includes('a.imageCredit.note'));
});


test('Chargers section titles are substantially larger at mobile and desktop widths',()=>{
  const css=read('app/globals.css');
  assert.match(css,/\.chargersArticle \.articleBody \.articleSectionHead\{font:700 clamp\(32px,4\.8vw,46px\)\/1\.08 Georgia,serif/);
  assert.ok(read('app/articles/[slug]/page.js').includes("slug==='hollis-chargers-thought-of-everything'?' chargersArticle':''"));
});
