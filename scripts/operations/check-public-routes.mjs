#!/usr/bin/env node
// Production smoke test. Every expected public article must return HTTP 200 and render actual content.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validatePublicPage} from './public-route-validation.mjs';
const origin=(process.env.BASE_URL||'https://www.ordinarybrief.com').replace(/\/$/,'');
const slug=process.env.ARTICLE_SLUG||'hollis-mike-ditka-juice-box-guy';
const expectedTitle=process.env.EXPECTED_TITLE||'The Juice Box Guy';
assert.equal(new URL(origin).protocol,'https:');
const parsed=new URL(origin);
assert.equal(parsed.origin,origin,'Expected an HTTPS origin without credentials or a path');
if(process.env.VERCEL_TRUSTED_OIDC_TOKEN)assert.ok(parsed.hostname.endsWith('.vercel.app'),'Identity credentials require a verified Vercel deployment origin');
assert.match(slug,/^[a-z0-9-]+$/);
const paths=['/','/sunday-crew','/doge',...['','/sunday-crew','/doge'].map(prefix=>prefix+'/articles/'+slug)];
let errors=0;
for(const path of paths){
 try{
  const res=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache','User-Agent':'TheBrief-ProductionSmoke/1.0',...(process.env.VERCEL_TRUSTED_OIDC_TOKEN?{'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_TRUSTED_OIDC_TOKEN}:{})}});
  const body=await res.text();
  const article=path.includes('/articles/');
  validatePublicPage(res.status,body,{article,expectedTitle:article?expectedTitle:undefined});
  const ok=true;
  console.log(ok?'PASS':'FAIL',res.status,path,'title:',article?body.includes(expectedTitle):'n/a');
  if(!ok)errors++;
 }catch(e){console.error('FAIL',path,e.message);errors++}
}
// Feature-specific smoke check: a deployment's HTTP 200 alone cannot validate the changed media.
const featurePath=process.env.FEATURE_ARTICLE_PATH;
const featureImage=process.env.FEATURE_IMAGE_PATH;
if(featurePath||featureImage){
 assert.ok(featurePath&&featureImage,'Both FEATURE_ARTICLE_PATH and FEATURE_IMAGE_PATH are required');
 assert.match(featurePath,/^\/articles\/[a-z0-9-]+$/);
 assert.match(featureImage,/^\/images\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp)$/i);
 const page=await fetch(origin+featurePath,{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
 const html=await page.text();
 assert.equal(page.status,200,'Feature article not live');
 assert.ok(html.includes(featureImage),'Feature article does not reference expected image');
 const asset=await fetch(origin+featureImage,{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
 const bytes=await asset.arrayBuffer();
 assert.equal(asset.status,200,'Featured image failed');
 assert.match(asset.headers.get('content-type')||'',/^image\//i,'Featured asset is not an image');
 assert.ok(bytes.byteLength>4096,'Featured image appears truncated or empty');
 console.log('PASS featured image',featurePath,featureImage,bytes.byteLength,'bytes');
}
// Owner-approved Detroit School release: validate the changed content in every edition,
// retaining all existing public-route checks above. No mutation or credentials are introduced.
const detroitTitle='A Study in Movement: The Detroit School, 2026';
const detroitDek='On the spontaneous birth of an artistic movement, and the evolution of human expression.';
const detroitPlates=[
  {
    "caption": "Plate I. The Gibbs Proposition.",
    "alt": "Jahmyr Gibbs extends both arms and lifts a leg beside an official during the celebration.",
    "source": "/images/editorial/detroit-school/jameson.webp",
    "sha256": "cdd5239674dd4869712f5ba96852beefd6f1c10f359be04c22b8a1277076d36c"
  },
  {
    "caption": "Plate II. The Formation of a School.",
    "alt": "Detroit teammates assembling into a shared celebration.",
    "source": "/images/editorial/detroit-school/composition.webp",
    "sha256": "e731dc8c75ca285bab557f3166680618c58357bae4a4a124976589b3891e0310"
  },
  {
    "caption": "Plate III. The Rejection of Consensus.",
    "alt": "Jameson Williams gestures independently behind his Detroit teammates.",
    "source": "/images/editorial/detroit-school/genesis.webp",
    "sha256": "bec9609ded4f43aa01a7bbf24d7a3bc59ea4b671685d14779d4111440d1af36a"
  },
  {
    "caption": "Plate IV. The Monumental Tradition.",
    "alt": "Penei Sewell, number 58, extends his arms in celebration.",
    "source": "/images/editorial/detroit-school/sewell.webp",
    "sha256": "cbc6cb895b43c2220360577919254afaef45ba0515be18ae4afa3f1ca9e8e22f"
  },
  {
    "caption": "Plate V. Vernacular Movement.",
    "alt": "A Detroit offensive lineman raises his arms alongside his teammates.",
    "source": "/images/editorial/detroit-school/offensive-line.webp",
    "sha256": "91afc55175d852059d3203a2dfd343ccd7f9ff2258aa9f194db825ad7d6e8cc9"
  },
  {
    "caption": "Plate VI. The Accusation.",
    "alt": "Christian Mahogany points toward Green Bay player Karl Brooks.",
    "source": "/images/editorial/detroit-school/accusation.webp",
    "sha256": "471ddc2488a59a8f86d2aec001e9bce78beb67c691ec065c82aa4feed8f45731"
  },
  {
    "caption": "Plate VII. The Completed Composition.",
    "alt": "Detroit teammates perform separate celebratory movements together in the wider composition.",
    "source": "/images/editorial/detroit-school/completed-composition-selected.png",
    "sha256": "a31b7024bad7644d76e6684b62ca91693b257787603e382e92f0cd71689940c9"
  }
];
const releaseHeaders={'Cache-Control':'no-cache',...(process.env.VERCEL_TRUSTED_OIDC_TOKEN?{'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_TRUSTED_OIDC_TOKEN}:{})};
const checkedImages=new Map();
const imageCacheIds=new Map();
async function verifyReleaseImage(path,expectedHash){
 assert.ok(path.startsWith('/images/'),'Unexpected image location');
 if(checkedImages.has(path)){if(expectedHash)assert.equal(checkedImages.get(path),expectedHash,'Detroit image bytes changed: '+path);return;}
 const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:releaseHeaders});
 assert.equal(response.status,200,'Detroit image unavailable: '+path);
 assert.match(response.headers.get('content-type')||'',/^image\//);
 const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length>4096,'Detroit image truncated: '+path);
 if(expectedHash)assert.equal(createHash('sha256').update(bytes).digest('hex'),expectedHash,'Detroit image bytes changed: '+path);
 imageCacheIds.set(path,createHash('sha256').update(bytes).update('webp-v1').digest('hex').slice(0,20));
 checkedImages.set(path,createHash('sha256').update(bytes).digest('hex'));
}
for(const root of ['', '/sunday-crew','/doge']){
 const home=await fetch(origin+(root||'/'),{redirect:'manual',signal:AbortSignal.timeout(20000),headers:releaseHeaders});
 const homeHtml=await home.text();validatePublicPage(home.status,homeHtml,{article:false});
 assert.ok(homeHtml.includes('aria-label="Lead story: '+detroitTitle+'"'),'Detroit is not homepage lead: '+root);
 const lead=homeHtml.split('aria-label="Lead story: '+detroitTitle+'"')[1].split('</section>')[0];
 assert.ok(lead.includes('href="'+root+'/articles/marnie-detroit-school"'),'Lead links to wrong edition');
 const hero=lead.match(/<img[^>]*src="([^"]+)"[^>]*alt="Detroit Lions teammates celebrate together on the field\."/);
 assert.ok(hero,'Detroit lead image missing');await verifyReleaseImage(hero[1]);
 const row=homeHtml.split('aria-label="Recent stories"')[1]?.split('</section>')[0];assert.ok(row,'Recent stories missing');
 const expectedCards=['Allow Me to Reintroduce Myself','The Delicate Etiquette of a Sporting Pat','The Medical Clearance Industrial Complex'];
 assert.deepEqual([...row.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(m=>m[1]),expectedCards,'Three-card chronology changed');
 const path=root+'/articles/marnie-detroit-school';
 const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:releaseHeaders});
 const html=await response.text();validatePublicPage(response.status,html,{article:true,expectedTitle:detroitTitle});
 assert.ok(html.includes(detroitDek),'Detroit subtitle changed');
 const bylineIndex=html.indexOf('class="articleBylineShare"');const clipIndex=html.indexOf('The Detroit School in performance.');
 assert.ok(bylineIndex>=0&&clipIndex>bylineIndex,'Byline must precede tweet');
 assert.ok(!/<img[^>]*class="articleImage(?:\s|"|$)/.test(html),'Redundant article hero returned');
 const body=html.split('<article class="articleBody">')[1]?.split('</article>')[0];assert.ok(body,'Article body missing');
 const figures=[...body.matchAll(/<figure[^>]*class="articleInlineFigure[^>]*>([\s\S]*?)<\/figure>/g)].map(m=>m[1]);
 assert.equal(figures.length,7,'Expected seven Detroit plates');
 for(const [i,plate] of detroitPlates.entries()){
  assert.ok(figures[i].includes(plate.caption)&&figures[i].includes('alt="'+plate.alt+'"'),'Detroit plate assignment changed: '+plate.caption);
  const src=figures[i].match(/<img[^>]*src="([^"]+)"/);assert.ok(src,'Plate image missing');
  await verifyReleaseImage(plate.source,plate.sha256);
  const cacheId=imageCacheIds.get(plate.source);
  assert.ok(src[1]===plate.source||src[1]===`/images/cache/${cacheId}-1280.webp`,'Wrong rendered Detroit plate source');
  await verifyReleaseImage(src[1]);
 }
 console.log('PASS Detroit School lead, three-card chronology, article and seven plate assets',root||'/');
}

if(process.env.RELEASE_CANARY_FAIL==='1')throw Error('Intentional staging failure canary; release MUST NOT be promoted');
if(errors)throw Error(errors+' public routes failed. DO NOT MARK RELEASE VERIFIED.');
