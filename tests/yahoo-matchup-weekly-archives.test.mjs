import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {selectYahooMatchupEdition,hasYahooArchivedMatchup} from '../lib/select-yahoo-matchup-edition.mjs';

const archives=[8,9,10].map(week=>JSON.parse(readFileSync(new URL(`../data/week${week}-edition-archives.json`,import.meta.url),'utf8')));
const leagueKeys={'sunday-crew':'470.l.197826',doge:'470.l.226614'};
const keys=Object.keys(leagueKeys);
const current=slug=>({tenant:{slug},snapshots:{matchups:{data:{data:{matchupWeek:11,leagueKey:leagueKeys[slug]}}}}});

for (const editionSlug of keys) {
  const currentEdition=current(editionSlug);
  const select=requested=>selectYahooMatchupEdition({currentEdition,requested,editionSlug,archivedEditions:archives});
  for (const [index,archive] of archives.entries()) {
    const week=index+8;
    const snapshots=archive[editionSlug].snapshots;
    const games=snapshots.matchups.data.data.matchups;
    test(`${editionSlug} Week ${week} selects all six final matchups with both historical lineups`,()=>{
      assert.equal(select(week).snapshots,snapshots);
      assert.equal(select(week).tenant.slug,editionSlug);
      assert.equal(games.length,6);
      for (const game of games) {
        const chosen=select(week).snapshots;
        const ids=[game.home.teamId,game.away.teamId].map(String).sort();
        const routed=chosen.matchups.data.data.matchups.find(x=>[x.home.teamId,x.away.teamId].map(String).sort().join()===ids.join());
        assert.equal(routed,game);
        assert.equal(hasYahooArchivedMatchup({archivedEditions:archives,editionSlug,week,game}),true);
        assert.equal(game.status,'final');
        for (const side of [game.home,game.away]) {
          assert.equal(side.teamKey,`${leagueKeys[editionSlug]}.t.${side.teamId}`);
          const roster=chosen.rosters.data.data.find(x=>x.teamKey===side.teamKey);
          assert.ok(roster?.players?.length);
          if (week===10) {
            assert.equal(Number(roster.snapshot.week),10);
            const starters=roster.players.filter(p=>!['BN','IR'].includes(p.selectedPosition));
            assert.ok(starters.every(p=>typeof p.points==='number'));
            assert.ok(Math.abs(starters.reduce((sum,p)=>sum+p.points,0)-side.points)<0.001);
          }
        }
      }
    });
  }
  test(`${editionSlug} current and unknown week behavior stays intact`,()=>{
    assert.equal(select(0),currentEdition);
    assert.equal(select(11),currentEdition);
    assert.equal(select(7),null);
    assert.equal(select(12),null);
  });
}
test('unknown edition never borrows another league archive',()=>{
  assert.equal(selectYahooMatchupEdition({currentEdition:current('doge'),requested:10,editionSlug:'other',archivedEditions:archives}),null);
});

for (const slug of keys) {
  test(`${slug} scoreboard history only links available matchup pages`,()=>{
    const game=archives[2][slug].snapshots.matchups.data.data.matchups[0];
    const available=(week,which=game)=>hasYahooArchivedMatchup({archivedEditions:archives,editionSlug:slug,week,game:which});
    assert.equal(available(10),true);
    assert.equal(available(7),false);
    assert.equal(available(11),false);
    assert.equal(available(10,{...game,away:{teamId:'unregistered'}}),false);
  });
}
