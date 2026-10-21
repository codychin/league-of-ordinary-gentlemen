import fs from 'node:fs';
import assert from 'node:assert/strict';
const sources=JSON.parse(fs.readFileSync('data/week6-approved-recap-media.json'));
assert.equal(sources.length,18);assert.equal(new Set(sources.map(s=>s.id)).size,18);
for(const edition of ['loog','sunday-crew','doge']){
 const items=sources.filter(s=>s.edition===edition);assert.equal(items.length,6);
 assert.equal(new Set(items.flatMap(s=>s.teamIds)).size,12);
 for(const {id} of items)for(const path of [`public/reels/${id}.mp4`,...['index.m3u8','init.mp4','poster.jpg','seg_000.m4s'].map(f=>`public/reels-hls/${id}/${f}`)])assert.ok(fs.statSync(path).size>0,path);
}
const loog=JSON.parse(fs.readFileSync('data/week6-loog-approved-recap-reels.json'));
assert.deepEqual(loog.map(v=>v.id).sort(),sources.filter(s=>s.edition==='loog').map(v=>v.id).sort());
for(const [edition,file] of [['sunday-crew','sunday'],['doge','doge']]){
 const text=fs.readFileSync(`lib/${file}-reels.js`,'utf8');
 const ids=[...text.matchAll(/id:"([a-f0-9]{32})"/g)].map(m=>m[1]);
 assert.deepEqual(ids.sort(),sources.filter(s=>s.edition===edition).map(v=>v.id).sort());
 assert.ok(!text.includes('videoUrl:urls'));
}
assert.match(fs.readFileSync('app/page.js','utf8'),/loog-week6-recap-v1/);
assert.match(fs.readFileSync('app/matchups/[a]/[b]/page.js','utf8'),/const recapReel=final&&Number\(latest.week\)===6/);
assert.match(fs.readFileSync('app/components/editions/Matchup.js','utf8'),/const recapReel=isFinal&&week===6/);
console.log('18 approved recap assets, league isolation, exact pairs and final-only routes verified');
