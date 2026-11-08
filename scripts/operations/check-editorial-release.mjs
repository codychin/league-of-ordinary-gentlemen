import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validatePublicPage} from './public-route-validation.mjs';
export async function checkEditorialRelease({origin,manifest,headers={}}){
 assert.equal(manifest.schemaVersion,1);
 const chargersTitle=manifest.lead.title,detroitTitle=manifest.article.title,detroitDek=manifest.article.dek,detroitPlates=manifest.article.plates;
const releaseHeaders=headers;
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
 assert.ok(homeHtml.includes('aria-label="Lead story: '+chargersTitle+'"'),'Chargers is not homepage lead: '+root);
 const lead=homeHtml.split('aria-label="Lead story: '+chargersTitle+'"')[1].split('</section>')[0];
 assert.ok(lead.includes('href="'+root+'/articles/'+manifest.lead.slug+'"'),'Lead links to wrong edition');
 const hero=[...lead.matchAll(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/g)].find(m=>m[2]===manifest.lead.imageAlt);
 assert.ok(hero,'Chargers lead image missing');await verifyReleaseImage(hero[1]);
 const row=homeHtml.split('aria-label="Recent stories"')[1]?.split('</section>')[0];assert.ok(row,'Recent stories missing');
 const expectedCards=manifest.carousel;
 assert.deepEqual([...row.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(m=>m[1]),expectedCards,'Three-card chronology changed');
 const path=root+'/articles/'+manifest.article.slug;
 const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:releaseHeaders});
 const html=await response.text();validatePublicPage(response.status,html,{article:true,expectedTitle:detroitTitle});
 assert.ok(html.includes(detroitDek),'Detroit subtitle changed');
 const bylineIndex=html.indexOf('class="articleBylineShare"');const clipIndex=html.indexOf(manifest.article.clipLabel);
 assert.ok(bylineIndex>=0&&clipIndex>bylineIndex,'Byline must precede tweet');
 assert.ok(!/<img[^>]*class="articleImage(?:\s|"|$)/.test(html),'Redundant article hero returned');
 const body=html.split('<article class="articleBody">')[1]?.split('</article>')[0];assert.ok(body,'Article body missing');
 const figures=[...body.matchAll(/<figure[^>]*class="articleInlineFigure[^>]*>([\s\S]*?)<\/figure>/g)].map(m=>m[1]);
 assert.equal(figures.length,detroitPlates.length,'Expected release plates');
 for(const [i,plate] of detroitPlates.entries()){
  assert.ok(figures[i].includes(plate.caption)&&figures[i].includes('alt="'+plate.alt+'"'),'Detroit plate assignment changed: '+plate.caption);
  const src=figures[i].match(/<img[^>]*src="([^"]+)"/);assert.ok(src,'Plate image missing');
  await verifyReleaseImage(plate.source,plate.sha256);
  const cacheId=imageCacheIds.get(plate.source);
  assert.ok(src[1]===plate.source||src[1]===`/images/cache/${cacheId}-1280.webp`,'Wrong rendered Detroit plate source');
  await verifyReleaseImage(src[1]);
 }
 console.log('PASS Chargers lead, three-card chronology, Detroit article and seven plate assets',root||'/');
}

}
