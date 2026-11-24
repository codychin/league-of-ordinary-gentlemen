import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {selectYahooMatchupEdition,hasYahooArchivedMatchup,findYahooMatchup} from '../lib/select-yahoo-matchup-edition.mjs';

const archives=[8,9,10,11].map(week=>JSON.parse(readFileSync(new URL(`../data/week${week}-edition-archives.json`,import.meta.url),'utf8')));
const leagueKeys={'sunday-crew':'470.l.197826',doge:'470.l.226614'};
const keys=Object.keys(leagueKeys);
const current=(slug,week=12)=>({tenant:{slug},snapshots:{matchups:{data:{data:{matchupWeek:week,leagueKey:leagueKeys[slug]}}}}});

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
          if (week>=10) {
            assert.equal(Number(roster.snapshot.week),week);
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
    assert.equal(select(12),currentEdition);
    assert.equal(select(7),null);
    assert.equal(select(13),null);
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
    assert.equal(available(13),false);
    assert.equal(available(10,{...game,away:{teamId:'unregistered'}}),false);
  });
}

for (const editionSlug of keys) {
  test(`${editionSlug}: all former bare Week 10 URLs survive the Week 11 switch`,()=>{
    const legacyArchives=archives.slice(0,3);
    const archive=legacyArchives[2][editionSlug];
    const original=archive.snapshots.matchups.data.data.matchups;
    const currentEdition=current(editionSlug,11);
    const now=currentEdition.snapshots.matchups.data.data;
    now.matchups=week11[editionSlug].map(([h,a])=>({home:{teamId:String(h)},away:{teamId:String(a)}}));
    const lookup=(a,b,requested=0,set=legacyArchives)=>selectYahooMatchupEdition({currentEdition,requested,editionSlug,archivedEditions:set,a,b});
    for(const game of original){
      const {home,away}=game;
      assert.equal(lookup(home.teamId,away.teamId).snapshots,archive.snapshots);
      assert.equal(lookup(away.teamId,home.teamId).snapshots,archive.snapshots);
      assert.equal(lookup(home.teamId,away.teamId,10).snapshots,archive.snapshots);
    }
    for(const [a,b] of week11[editionSlug]) assert.equal(lookup(a,b),currentEdition);
    const {home,away}=original[0], a=home.teamId,b=away.teamId;
    const dup=structuredClone(archive);
    dup.week=7;
    dup.snapshots.matchups.data.data.matchupWeek=7;
    assert.equal(lookup(a,b,0,[...legacyArchives,{[editionSlug]:dup}]),null,'ambiguous archived pair');
    assert.equal(lookup(a,b,NaN),null,'malformed explicit week does not fall back');
    assert.equal(lookup(a,b,12),null,'unknown explicit week does not fall back');
    assert.equal(lookup('unknown',b),null);
    assert.equal(lookup(a,a),null);
    const foreign=editionSlug==='doge'?'sunday-crew':'doge';
    assert.equal(lookup(a,b,0,[{[foreign]:archive}]),null,'no cross-edition fallback');
    now.matchups=[{home:{teamId:a},away:{teamId:b}}];
    assert.equal(lookup(a,b,0,[...legacyArchives,{[editionSlug]:dup}]),currentEdition,'current pairing takes precedence even if several archived weeks match');
  });
}

const week11={'sunday-crew':[[1,12],[2,9],[3,11],[4,8],[5,6],[7,10]],doge:[[1,10],[2,8],[3,5],[4,7],[6,9],[11,12]]};

const week12={'sunday-crew':[[1,11],[2,7],[3,6],[4,5],[8,9],[10,12]],doge:[[1,12],[2,3],[4,10],[5,11],[6,8],[7,9]]};
const sourceIds={'sunday-crew':[439,440,441],doge:[443,444,445]};

for (const editionSlug of keys) {
  test(`${editionSlug} Week 11 current views survive append and exact dated finals retain their scores, lineups, and records after Week 12 switch`,()=>{
    const week11Entry=archives[3][editionSlug], snapshots=week11Entry.snapshots;
    const previous=archives[2][editionSlug].snapshots.standings.data.data.standings;
    const now=current(editionSlug), currentGames=now.snapshots.matchups.data.data;
    currentGames.matchups=week12[editionSlug].map(([h,a])=>({home:{teamId:String(h)},away:{teamId:String(a)}}));
    const stillWeek11={tenant:{slug:editionSlug},snapshots};
    const select=(a,b,requested,currentEdition=now)=>selectYahooMatchupEdition({currentEdition,requested,editionSlug,archivedEditions:archives,a,b});
    const games=snapshots.matchups.data.data.matchups;
    assert.deepEqual(games.map(g=>[Number(g.home.teamId),Number(g.away.teamId)]),week11[editionSlug]);
    assert.equal(new Set(games.flatMap(g=>[g.home.teamId,g.away.teamId])).size,12);
    assert.equal(snapshots.rosters.data.data.length,12);
    assert.equal(new Set(snapshots.rosters.data.data.map(r=>r.teamKey)).size,12);
    assert.equal(snapshots.standings.data.data.standings.length,12);
    assert.equal(new Set(snapshots.standings.data.data.standings.map(r=>r.teamKey)).size,12);
    assert.equal(snapshots.matchups.data.data.currentWeek,11);
    assert.equal(snapshots.matchups.data.data.matchupWeek,11);
    assert.deepEqual(['matchups','standings','rosters'].map(k=>snapshots[k].data.sourceEvidence.canonicalSnapshotId),sourceIds[editionSlug]);
    for (const game of games) {
      const {home,away}=game;
      assert.equal(game.status,'final');
      assert.equal(game.winner,home.points>away.points?'home':home.points<away.points?'away':'tie');
      assert.equal(select(home.teamId,away.teamId,11,stillWeek11),stillWeek11);
      assert.equal(select(home.teamId,away.teamId,0,stillWeek11),stillWeek11);
      assert.ok(hasYahooArchivedMatchup({archivedEditions:archives,editionSlug,week:11,game}));
      for (const [a,b] of [[home,away],[away,home]]) {
        const exact=select(a.teamId,b.teamId,11);
        assert.equal(exact.tenant.slug,editionSlug);
        assert.equal(exact.snapshots,snapshots);
        assert.equal(findYahooMatchup(exact.snapshots.matchups.data.data.matchups,a.teamId,b.teamId),game);
        assert.ok(Number.isFinite(a.points)&&Number.isFinite(b.points));
        const roster=exact.snapshots.rosters.data.data.find(r=>r.teamKey===a.teamKey);
        assert.equal(roster.snapshot.week,11);
        assert.equal(roster.pointsCoverage.week,11);
        const active=roster.players.filter(p=>!['BN','IR'].includes(p.selectedPosition));
        assert.ok(active.length>0 && active.every(p=>Number.isFinite(p.points)));
        assert.ok(Math.abs(active.reduce((sum,p)=>sum+p.points,0)-a.points)<0.001);
        const oldStanding=previous.find(r=>r.teamKey===a.teamKey);
        const record=exact.snapshots.standings.data.data.standings.find(r=>r.teamKey===a.teamKey);
        assert.equal(Number(record.wins),Number(oldStanding.wins)+Number(a.points>b.points));
        assert.equal(Number(record.losses),Number(oldStanding.losses)+Number(a.points<b.points));
        assert.equal(Number(record.ties),Number(oldStanding.ties)+Number(a.points===b.points));
        assert.ok(Math.abs(Number(record.pointsFor)-Number(oldStanding.pointsFor)-a.points)<0.001);
        assert.ok(Math.abs(Number(record.pointsAgainst)-Number(oldStanding.pointsAgainst)-b.points)<0.001);
      }
    }
    for (const currentGame of currentGames.matchups) {
      const {home:{teamId:a},away:{teamId:b}}=currentGame;
      assert.equal(select(a,b,12),now);
      assert.equal(select(a,b,0),now);
      assert.equal(findYahooMatchup(select(a,b,11).snapshots.matchups.data.data.matchups,a,b),undefined);
      assert.equal(hasYahooArchivedMatchup({archivedEditions:archives,editionSlug,week:11,game:currentGame}),false);
      assert.equal(select(a,b,NaN),null);
      assert.equal(select(a,b,13),null);
    }
    for (const game of archives[2][editionSlug].snapshots.matchups.data.data.matchups) {
      assert.equal(select(game.home.teamId,game.away.teamId,0).snapshots,archives[2][editionSlug].snapshots);
    }
  });
}
