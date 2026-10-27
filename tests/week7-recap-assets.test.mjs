import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const assets=JSON.parse(fs.readFileSync('qa/week7-recap-assets.json','utf8'));
const media=JSON.parse(fs.readFileSync('data/week7-approved-homepage-media.json','utf8'));
test('canonical recap release contains only the 268 exact original and HLS files',()=>{
 assert.equal(assets.files.length,268);
 assert.equal(new Set(assets.files.map(f=>f.path)).size,268);
 assert.equal(assets.files.filter(f=>f.path.startsWith('public/reels-hls/')).length,250);
 assert.equal(assets.files.reduce((n,f)=>n+f.bytes,0),315018580);
 for(const f of assets.files){
  assert.match(f.path,/^public\/(?:reels\/[a-f0-9]{32}\.mp4|reels-hls\/[a-f0-9]{32}\/(?:index\.m3u8|poster\.jpg|init\.mp4|seg_\d{3}\.m4s))$/);
  const bytes=fs.readFileSync(f.path);assert.equal(bytes.length,f.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
  assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex'),f.sha);
 }
 assert.equal(assets.bindings.length,18);
 for(const r of media){
  const binding=assets.bindings.find(b=>b.videoId===r.id);assert.ok(binding);
  assert.equal(binding.edition,r.edition);assert.deepEqual(binding.pair.map(Number).sort((a,b)=>a-b),r.teamIds.map(Number).sort((a,b)=>a-b));
  assert.equal(binding.correspondent,r.writer);assert.equal(binding.scriptSha256,r.scriptSha256);assert.equal(binding.sourceSha256,r.sourceSha256);
 }
 assert.ok(!JSON.stringify(assets).match(/https?:\/\/|\/workspace\/|signed|budget|billing|transport\/|part_\d/i));
});
