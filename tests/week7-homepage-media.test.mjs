import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const items=JSON.parse(read('data/week7-approved-homepage-media.json'));
const pairs={loog:['2-5','7-12','4-10','3-8','9-11','1-6'],'sunday-crew':['1-8','2-10','3-4','5-12','6-9','7-11'],doge:['1-6','2-7','3-8','4-12','5-10','9-11']};
test('Week 7 has exactly six independently approved packaged clips per edition',()=>{
 assert.equal(items.length,18);assert.equal(new Set(items.map(r=>r.id)).size,18);
 for(const [edition,expected] of Object.entries(pairs)){
  const rows=items.filter(r=>r.edition===edition);assert.equal(rows.length,6);
  assert.deepEqual(rows.map(r=>r.teamIds.map(Number).sort((a,b)=>a-b).join('-')).sort(),expected.sort());
  for(const r of rows){
   assert.match(r.id,/^[a-f0-9]{32}$/);assert.equal(r.season,2026);assert.equal(r.week,7);assert.equal(r.kind,'preview');
   assert.equal(r.qaStatus,'media_qa_passed');assert.ok(r.approvalSource);assert.match(r.scriptSha256,/^[a-f0-9]{64}$/);assert.ok(r.voiceId);assert.ok(r.sourceRevision);
   assert.ok(!r.videoUrl,'Use durable packaged playback, not temporary provider URLs');
   const base=`public/reels-hls/${r.id}/`;
   const m=read(base+'index.m3u8');assert.match(m,/^#EXTM3U/m);assert.match(m,/#EXT-X-ENDLIST/);
   const seg=m.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
   const maps=[...m.matchAll(/#EXT-X-MAP:[^\r\n]*URI="([^"]+)"/g)].map(x=>x[1]);assert.ok(seg.length&&maps.length);
   for(const f of [...seg,...maps]){assert.match(f,/^[a-zA-Z0-9_-]+\.(?:m4s|mp4)$/);assert.ok(fs.statSync(base+f).size>0);}
   for(const p of [`public/reels/${r.id}.mp4`,base+'poster.jpg',base+'init.mp4',base+'seg_000.m4s'])assert.ok(fs.statSync(p).size>0);
  }
 }
});
test('Week 7 release binds only homepages; matchup text and historic assets remain separate',()=>{
 const page=read('app/page.js'),config=read('lib/edition-content.js');
 assert.match(page,/week7Reels\('loog'\)/);assert.match(page,/loog-week7-preview-v2/);
 for(const e of ['sunday-crew','doge']){assert.ok(config.includes(`week7Reels('${e}')`));assert.ok(config.includes(`${e}-week7-preview-v2`));}
 for(const p of ['app/matchups/[a]/[b]/page.js','app/components/editions/Matchup.js'])assert.ok(!read(p).includes('<video'));
});
