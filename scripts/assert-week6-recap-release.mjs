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
// Week 6 assets and pairings remain immutable archives; active shelf coverage lives in week7-homepage-media.test.mjs.
assert.ok(loog.every(r=>r.week===6&&r.season===2026&&r.kind==='recap'));
for(const path of ['app/matchups/[a]/[b]/page.js','app/components/editions/Matchup.js']){
 const text=fs.readFileSync(path,'utf8');assert.ok(!text.includes('<video'),path+' must be text-only');
 assert.ok(text.includes('selectMatchupColumn'));assert.ok(text.includes('.map((paragraph,index)=><p'));
}
for(const path of ['app/components/LiveWeek3Surfaces.jsx','app/components/EditionScoreboard.jsx'])assert.ok(!fs.readFileSync(path,'utf8').includes('CompletedScoresSummary'));
const recaps=JSON.parse(fs.readFileSync('data/matchup-recaps.json')).filter(r=>Number(r.week)===6&&Number(r.season)===2026);
assert.equal(recaps.length,18);
for(const r of recaps){assert.ok(r.body.trim().split(/\s+/).length>=200);assert.ok(r.body.split(/\n\n+/).length>=3);}
console.log('18 approved homepage recap videos; text-only long-form matchups; clean score overviews verified');
