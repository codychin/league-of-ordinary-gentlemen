import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {parse} from '@babel/parser';
const root=fileURLToPath(new URL('../',import.meta.url));
const baker='maude-baker-comparative-merits-of-abstention',detroit='marnie-detroit-school';

// Execute the real production source adapter in a child process. No generated
// file writes or shared cwd changes, so this can run with the full root suite.
function sourceFeed(){
 const code=`import {build} from 'esbuild';const result=await build({entryPoints:['scripts/source.mjs'],bundle:true,platform:'node',format:'esm',write:false});const {feed}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));console.log(JSON.stringify(feed));`;
 return JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:root+'native/brief',encoding:'utf8'}));
}

test('current production dynamic primary photos resolve to their own canonical article without freezing inventory',()=>{
 const feed=sourceFeed(),home=feed.home.flatMap(m=>m.cards);
 const source=readFileSync(root+'app/components/SharedEditorialFront.js','utf8');
 const tree=parse(source,{sourceType:'module',plugins:['jsx']});
 walk(tree,node=>{
  if(node.type!=='JSXElement'||node.openingElement.name.name!=='Link')return;
  const href=node.openingElement.attributes.find(a=>a.name?.name==='href');
  const slug=href&&source.slice(href.start,href.end).match(/\/articles\/([a-z0-9-]+)/)?.[1];
  const placement=home.find(c=>c.slug===slug),canonical=feed.cards.find(c=>c.slug===slug);
  if(!placement||!canonical)return; // Removal or editorial reordering is allowed.
  const photos=[];walk(node,n=>{
   if(n.type==='JSXOpeningElement'&&['img','Image','ResilientImage'].includes(n.name.name)){
    const src=n.attributes.find(a=>a.name?.name==='src');if(src)photos.push({start:n.start,value:src.value});
   }
   if(n.type==='CallExpression'&&n.callee.name==='imageBackground')photos.push({start:n.start,value:{type:'JSXExpressionContainer',expression:n.arguments[0]}});
  });
  photos.sort((a,b)=>a.start-b.start);const primary=photos[0]?.value;
  if(primary?.type==='JSXExpressionContainer'&&primary.expression.type!=='StringLiteral')assert.equal(placement.image,canonical.image,slug);
 });
});

function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(n=>walk(n,fn));else if(value&&typeof value==='object')walk(value,fn);}}

// Immutable exact Link markup from SharedEditorialFront.js at main
// f593d59d871fd9a5dbeb43d11b22a8853dbc1c54. Captured for the repeated-photo
// report; this historical regression does not constrain future Home inventory.
const historicalBakerLink="<Link className={front.story} href={root+\"/articles/maude-baker-comparative-merits-of-abstention\"}><div className={front.image} role=\"img\" aria-label={bakerPhoto.alt} style={{backgroundImage:imageBackground(bakerPhoto.src,640),backgroundPosition:\"72% top\"}}><ImageLabel byline=\"MAUDE GANNON • FOOTBALL\" theme=\"THREE PASSES. ZERO YARDS.\"/></div><div className=\"eyebrow\">FOOTBALL • STRATEGY &amp; BAD PROCESS</div><h3>Baker Mayfield and the Comparative Merits of Abstention</h3><PreviewAuthor slug=\"maude-baker-comparative-merits-of-abstention\" date=\"NOVEMBER 2, 2026\"/><p className={`${front.dek} editorialDeck`}>An afternoon that satisfied the league’s scheduling requirements.</p></Link>";
const historicalDetroitLink="<Link className={front.story} href={root+\"/articles/marnie-detroit-school\"}><div className={front.image} role=\"img\" aria-label=\"Detroit Lions teammates celebrate together on the field.\" style={{backgroundImage:imageBackground('/images/editorial/detroit-school/homepage-gibbs-dance.webp',640),backgroundPosition:\"center top\"}}><ImageLabel byline=\"MARNIE KELLS • CULTURE\" theme=\"THE DETROIT SCHOOL • 2026\"/></div><div className=\"eyebrow\">MATTERS OF CULTURE • ART HISTORY</div><h3>A Study in Movement: The Detroit School, 2026</h3><PreviewAuthor slug=\"marnie-detroit-school\" date=\"OCTOBER 26\"/><p className={`${front.dek} editorialDeck`}>On the spontaneous birth of an artistic movement, and the evolution of human expression.</p></Link>";
test('historical authored Baker/Detroit links never borrow neighboring imagery in either order',async()=>{
 const {placementImage}=await import('../native/brief/scripts/placement-image.mjs');
 const b=historicalBakerLink,d=historicalDetroitLink;
 const canonical='/images/editorial/baker-abstention/baker-falcons-20261101-mike-carlson.jpg';
 for(const parts of [[b,d],[d,b]]){
  const jsx='<section>'+parts.join('')+'</section>',section=parse(jsx,{plugins:['jsx']}).program.body[0].expression;
  assert.equal(placementImage(section,jsx,baker,canonical),canonical);
  assert.equal(placementImage(section,jsx,detroit,'/canonical-detroit.webp'),'/images/editorial/detroit-school/homepage-gibbs-dance.webp');
 }
});

test('dynamic primary images do not borrow decorative images; equivalent href syntax is supported',async()=>{
 const {placementImage}=await import('../native/brief/scripts/placement-image.mjs');
 for(const href of ['"/articles/'+baker+'"',"{'/articles/"+baker+"'}",'{root+\'/articles/'+baker+'\'}','{`${root}/articles/'+baker+'`}']){
  const jsx=`<section><Link href=${href}><ResilientImage src={bakerPhoto.src}/><img src="/avatar.jpg"/></Link><Link href="/articles/${detroit}"><img src="/detroit.jpg"/></Link></section>`;
  const section=parse(jsx,{plugins:['jsx']}).program.body[0].expression;
  assert.equal(placementImage(section,jsx,baker,'/canonical-baker.jpg'),'/canonical-baker.jpg');
 }
});

test('intentional shared imagery and authored crop overrides are preserved, not deduplicated',async()=>{
 const {placementImage}=await import('../native/brief/scripts/placement-image.mjs');
 const jsx='<section><Link href="/articles/first"><img src="/shared-crop.webp"/></Link><Link href="/articles/second"><div style={{backgroundImage:imageBackground(\'/shared-crop.webp\')}}/></Link></section>';
 const section=parse(jsx,{plugins:['jsx']}).program.body[0].expression;
 assert.equal(placementImage(section,jsx,'first','/first-canonical.jpg'),'/shared-crop.webp');
 assert.equal(placementImage(section,jsx,'second','/second-canonical.jpg'),'/shared-crop.webp');
});
