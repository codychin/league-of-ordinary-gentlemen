import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const aut=read('../data/week8-autopsies.json'), starts=read('../data/week8-start-sit.json'), doge=read('../data/doge-autopsy.json');
const expected={"dogeAutopsy": "3fa8fff60c3d10dd261e2ab31f8225c2cad24cb92d9543f6d4e21baf840c2351", "dogeStartSit": "2f1d07478ba1045ea1a8101de2c2ec8a8a5e20042a20f8dde33a03493cfb1895", "loogStartSit": "838a102df6c0d775d3d0de78e986975759c3ce4f98453b3fe9ae162e11d80819", "loogAutopsy": "cd45b7fba71eaaa25120eb7fec4928076f69addca8d3706a425446ab6b9c118f", "sunday-crewAutopsy": "39af3166eb3685e6fbd5cff9cd87a4e77f346093ecc0789418752c20ef64c59d", "sunday-crewStartSit": "942dc1e384b20601c94799f872a10ae78c8b969def5ab5c1c54a3186f94175b4"};
for(const edition of ['loog','sunday-crew','doge']) test(`${edition} approved Week 8 section text and scope`,()=>{
 for(const [suffix,obj,key,count] of [['Autopsy',aut[edition],'findings',6],['StartSit',starts[edition],'picks',2]]) {
  assert.equal(obj.week,8);assert.equal(obj.season,2026);assert.equal(obj.status,'FINAL');assert.equal(obj[key].length,count);
  const hash=createHash('sha256').update(JSON.stringify(obj[key].map(p=>p.body))).digest('hex');assert.equal(hash,expected[edition+suffix]);
 }
});
test('DOGE active source matches approved scoped autopsy',()=>assert.deepEqual(doge,aut.doge));

test("each edition autopsy covers 12 distinct teams",()=>{for(const e of ["loog","sunday-crew","doge"])assert.equal(new Set(aut[e].findings.flatMap(f=>f.teams)).size,12);});
