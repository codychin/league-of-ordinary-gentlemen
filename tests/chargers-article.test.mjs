import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chargersArticle as article} from '../app/articles/hollis-chargers-thought-of-everything.js';
const read=p=>readFileSync(p,'utf8');
const slug='hollis-chargers-thought-of-everything';
const expectedClips=[
  "https://x.com/wokdior/status/2117020743552905692",
  "https://x.com/PolymarketBlitz/status/1952420570836107771",
  "https://x.com/YahooFantasy/status/2086947788932407614",
  "https://x.com/BoltUpYo/status/2118854276839805017",
  "https://x.com/TexansCommenter/status/2118356075510378912",
  "https://x.com/StBrownPodcast/status/2118045098503966799",
  "https://x.com/ESPNNFL/status/2118393718289924331",
  "https://x.com/Seahawks/status/2106864798541504937",
  "https://x.com/ClutchPoints/status/2117031697858560051",
  "https://x.com/nflnetwork/status/2118118709340627173",
  "https://x.com/NFLonCBS/status/2099262404420853837"
];

test('Chargers preserves the approved November 7 copy revision',()=>{
  assert.equal(article.title,'The Chargers Have Thought of Everything');
  assert.equal(article.author,'crane');
  assert.equal(createHash('sha256').update(JSON.stringify(article.body)).digest('hex'),'eddfb4bd53a531fcab681f3a232e3c990cf27b6d7e862b08e922e9f3da75d171');
  assert.equal(article.body.filter(p=>p?.type==='break').length,0);
  assert.equal(article.body.filter(p=>p?.type==='heading').length,6);
  assert.equal(article.body.at(-2),'There are ten more on the calendar.');
  assert.equal(article.body.at(-1),'McDaniel has some nerve telling us life is short.');
  assert.ok(article.body.some(p=>p?.type==='subheading'&&p.text==='Which brings us back to The Love Boat in 1978.'));
});

test('requested clip embeds replace standalone links without duplicate captions',()=>{
  const links=article.body.filter(p=>p?.type==='rich').map(p=>p.html.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&'));
  assert.deepEqual(links,[]);
  for(const p of article.body.filter(p=>p?.type==='rich')){
    assert.match(p.html,/target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(p.html,/<script|onerror|onclick/i);
  }
  const clips=article.body.filter(p=>p?.type==='xclip');
  assert.equal(clips.length,11);
  assert.deepEqual(clips.map(p=>p.url),expectedClips);
  for(const removed of ['2117743371523629290','2117042936831778965','R9maQiL9onk'])assert.ok(!JSON.stringify(article.body).includes(removed));
  for(const clip of clips)assert.ok(clip.url.endsWith('/status/'+clip.id));
  assert.deepEqual(article.body.filter(p=>p?.type==='youtube').map(({id,start})=>[id,start||0]),[['Hf-SPMJ0P3Y',0]]);
  assert.ok(read('app/components/ArticleClip.jsx').includes('Watch the original clip on X'));
});

test('Chargers review resolves through the shared article renderer in all editions',()=>{
  assert.ok(read('app/articles/data.js').includes("'"+slug+"': chargersArticle"));
  assert.ok(read('lib/editorial-scope.js').includes("'"+slug+"'"));
  assert.ok(read('app/components/editions/Article.js').includes('isSharedArticleForEdition(slug,editionSlug)'));
  assert.ok(read('app/components/SharedEditorialFront.js').includes('Lead story: '+article.title));
  assert.ok(!read('app/components/SharedEditorialFront.js').includes('dashiell-jaguars-london-future'));
  assert.ok(read('app/articles/data.js').includes('"dashiell-jaguars-london-future"'));
});


test('Chargers hero keeps verified attribution and locally cached image variants',()=>{
  assert.equal(article.image,'https://upload.wikimedia.org/wikipedia/commons/6/66/Jim_Harbaugh_with_Los_Angeles_Chargers_staffs.jpg');
  assert.match(article.imageAlt,/Jim Harbaugh.*October 5, 2025/);
  assert.equal(article.imageCredit.label,'Joe Glorioso / All-Pro Reels');
  assert.equal(article.imageCredit.licenseUrl,'https://creativecommons.org/licenses/by-sa/4.0/');
  assert.equal(article.imageCredit.licenseLabel,'CC BY-SA 4.0');
  assert.match(article.imageCredit.note,/Resized/);
  const asset=JSON.parse(read('lib/generated/image-manifest.json'))[article.image];
  assert.ok(asset);
  for(const width of [320,640,1280])assert.ok(readFileSync('public'+asset.variants[width]).length>0);
  const renderer=read('app/articles/[slug]/page.js');
  assert.ok(renderer.includes('href={a.imageCredit.licenseUrl}'));
  assert.ok(renderer.includes('a.imageCredit.note'));
});


test('Chargers section titles are substantially larger at mobile and desktop widths',()=>{
  const css=read('app/globals.css');
  assert.match(css,/\.chargersArticle \.articleBody \.articleSectionHead\{[^}]*border-top:0/);
  assert.match(css,/\.chargersArticle \.articleBody \.articleSectionHead\{font:700 clamp\(32px,4\.8vw,46px\)\/1\.08 Georgia,serif/);
  assert.ok(read('app/articles/[slug]/page.js').includes("slug==='hollis-chargers-thought-of-everything'?' chargersArticle':''"));
});


test('approved copy cuts and clip placement remain intact',()=>{
  const prose=article.body.filter(p=>typeof p==='string').join('\n');
  assert.match(prose,/a categorical error/);
  assert.match(prose,/the supreme nihilist Mike McDaniel himself/);
  assert.match(prose,/Harbaugh has prepared an Alamo speech/);
  assert.doesNotMatch(prose,/Normandy|I am prepared to hear an argument that/);
  assert.ok(article.body.includes('And then, finally, we get to Justin Herbert.'));
  const i=article.body.findIndex(p=>p?.id==='2118118709340627173');
  assert.equal(article.body[i-1],'Houston pass rusher Will Anderson Jr. has nevertheless offered a generous appraisal.');
  assert.ok(article.body[i+1].startsWith("Somewhere in the Texans' locker room"));
  const css=read('app/globals.css');
  assert.match(css,/\.chargersArticle \.articleBody>p:first-child:first-letter\{float:none;font:inherit;line-height:inherit;padding:0;margin:0\}/);
});


test('Gruden clip carries the quote and approved post-clip commentary preserves the callback',()=>{
  const i=article.body.findIndex(p=>p?.id==='2118854276839805017');
  assert.notEqual(article.body[i-2]?.type,'break');
  assert.match(article.body[i-1],/reached back through several decades of television/);
  assert.ok(!article.body[i-1].includes("I'd rather watch The Love Boat from 1978"));
  assert.ok(article.body[i+1].startsWith('1978 is an oddly specific refuge'));
  assert.ok(article.body[i+2].startsWith('Back on land,'));
  assert.ok(article.body.some(p=>typeof p==='string'&&p.startsWith('At some stage, the Chargers ought to be able to request')));
  const prose=article.body.filter(p=>typeof p==='string').join('\n');
  assert.doesNotMatch(prose,/He had only two recorded drops last season|These are apparently separate matters|There are ten more games on the schedule/);
  assert.ok(read('app/articles/[slug]/page.js').includes('<h3 className="articleSubheading"'));
  assert.match(read('app/globals.css'),/articleSubheading\{font:italic 400 clamp\(24px,3vw,28px\)/);
});

test('QJ abbreviation preserves the full section heading',()=>{assert.ok(article.body.some(p=>typeof p==='string'&&p.startsWith('QJ entered the league')));assert.ok(article.body.some(p=>p?.type==='heading'&&p.text==='Hands Off: Quentin Johnston and Ladd McConkey'));});

test("Colts shorthand is preserved",()=>assert.ok(article.body.some(p=>typeof p==="string"&&p.includes("Keenan Allen has 325 receiving yards for the Colts."))));

import {blocks} from '../native/brief/src/article-blocks.mjs';
test('native reader preserves the subordinate italic callback',()=>{const mapped=blocks(article.body);const i=article.body.findIndex(p=>p?.type==='subheading');assert.deepEqual(mapped[i],{id:`block-${i}`,type:'rich',nodes:[{kind:'em',children:[{text:'Which brings us back to The Love Boat in 1978.'}]}]});assert.equal(mapped.length,article.body.length);});

test("article typography outranks the newer production theme",()=>{
  const css=read('app/globals.css');
  assert.match(css,/main\.articleMain\.chargersArticle \.articleBody \.articleSectionHead\{font:700 clamp\(32px,4\.8vw,46px\)/);
  assert.match(css,/main\.articleMain\.chargersArticle \.articleBody>p:first-child:first-letter/);
});
