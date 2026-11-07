import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectMatchupColumn} from '../lib/select-matchup-column.mjs';
const previews=JSON.parse(fs.readFileSync(new URL('../data/week9-matchup-columns.json',import.meta.url)));
for(const edition of ['loog','sunday-crew','doge'])test(`${edition} Week9 approved v1a has six unique previews and exact selection`,()=>{
 const rows=previews.filter(x=>x.edition===edition);assert.equal(rows.length,6);assert.equal(new Set(rows.flatMap(x=>x.teamIds)).size,12);
 for(const row of rows){assert.equal(row.editorialVersion,'week9-v1b-current-20261107');assert.ok(row.body.length>500);assert.equal(selectMatchupColumn({previews,edition,week:9,a:row.teamIds[1],b:row.teamIds[0],isFinal:false}),row);assert.equal(selectMatchupColumn({previews,edition,week:9,a:row.teamIds[0],b:row.teamIds[1],isFinal:true}),null);}
});
test('v1a preserves corrected Greg/Matt direction and Sandy kicker',()=>{
 const dash=previews.find(x=>x.edition==='sunday-crew'&&x.writer==='pike');assert.match(dash.body,/Greg win opens a three-game lead/);
 const sabine=previews.find(x=>x.edition==='doge'&&x.writer==='march');assert.match(sabine.body,/Fairbairn was selected at kicker/);assert.match(sabine.body,/McConkey in a flex/);assert.doesNotMatch(sabine.body,/no kicker is selected/);
});
