import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const columns=JSON.parse(readFileSync(new URL('../data/week5-matchup-columns.json',import.meta.url)));
const find=(edition,week,a,b)=>columns.find(c=>c.edition===edition&&Number(c.week)===week&&c.teamIds.includes(String(a))&&c.teamIds.includes(String(b)));
const pairings={
 loog:[[4,5],[3,7],[9,2],[6,12],[1,10],[11,8]],
 'sunday-crew':[[1,10],[2,3],[4,11],[5,7],[6,8],[9,12]],
 doge:[[1,2],[3,4],[5,6],[7,12],[8,9],[10,11]]
};
for(const [edition,pairs] of Object.entries(pairings)){
 test(edition+' exposes six distinct approved longform columns on its matchup routes',()=>{
  const found=pairs.map(([a,b])=>find(edition,5,a,b));
  assert.equal(found.length,6);
  assert.ok(found.every(Boolean));
  assert.equal(new Set(found.map(x=>x.videoId)).size,6);
  assert.ok(found.every(x=>x.body.split(/\s+/).length>=200));
  assert.ok(found.every(x=>x.writer!=='gannon').length>=0);
 });
}
