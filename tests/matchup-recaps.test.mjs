import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectMatchupColumn} from '../lib/select-matchup-column.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url)));
const recaps=read('matchup-recaps.json'),previews=read('week5-matchup-columns.json'),evidence=read('week5-closeout.json');
for(const [edition,key] of Object.entries({loog:'loog','sunday-crew':'sundayCrew',doge:'doge'})) {
  test(edition+' has a verified recap for every Week 5 pairing, in either URL order',()=>{
    const games=evidence[key].matchups.matchups;
    assert.equal(recaps.filter(c=>c.edition===edition&&c.week===5&&c.season===2026).length,games.length);
    for(const game of games) {
      const a=game.home.teamId,b=game.away.teamId;
      const args={previews,recaps,edition,week:5,a,b,isFinal:true};
      const c=selectMatchupColumn(args);
      assert.ok(c);assert.equal(selectMatchupColumn({...args,a:b,b:a}),c);
      assert.equal(c.writer,selectMatchupColumn({...args,isFinal:false}).writer);
      assert.ok(c.body.split(/\n\n+/).length>=3);
      assert.ok(c.body.split(/\s+/).length>=200);
      assert.equal(c.source.status,'FINAL');
      for(const side of [game.home,game.away])assert.equal(c.source.scores.find(s=>s.teamId===String(side.teamId)).points,side.totalPoints??side.points);
    }
  });
}
test('recap selection fails closed across week, season, edition and finality',()=>{
  const args={previews,recaps,edition:'doge',week:5,a:1,b:2,isFinal:true};
  assert.equal(selectMatchupColumn({...args,week:6}),null);
  assert.equal(selectMatchupColumn({...args,season:2027}),null);
  assert.equal(selectMatchupColumn({...args,edition:'loog'}),null);
  assert.equal(selectMatchupColumn({...args,recaps:[]}),null);
  assert.equal(selectMatchupColumn({...args,isFinal:false}).kind,'pregame');
  assert.equal(selectMatchupColumn({...args,a:1,b:1}),null);
});
