import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {leagueSnapshot as current} from '../app/teams/league-data.js';
import {selectLoogScores} from '../lib/select-loog-scores.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const source=read('week8-loog-verified.json'),prior=read('week7-loog-snapshot.json');
const latest=read('latest-loog-scores.json'),completed=read('completed-loog-scores.json');
const round=n=>Math.round(n*100)/100;
test('Week 8 fallback uses six authenticated pairings and twelve exact-week lineups, never season stats as player points',()=>{
 assert.equal(source.season,2026);assert.equal(source.week,8);assert.equal(source.leagueId,'310731');
 assert.equal(source.sourceSnapshotIds.rosters,210);
 assert.equal(latest.matchups.length,6);assert.equal(source.rosters.length,12);
 assert.equal(new Set(latest.matchups.flatMap(g=>[g.home.id,g.away.id])).size,12);
 for(const g of latest.matchups){
  assert.equal(g.winner,'UNDECIDED');assert.equal(g.status,'PREGAME');
  for(const side of ['home','away']){
   assert.equal(g[side].score,0);
   const r=source.rosters.find(t=>t.teamId===g[side].id);
   assert.equal(r.snapshot.week,8);assert.equal(r.snapshot.providerScoringPeriodId,8);
   assert.ok(r.players.filter(p=>p.started).length);
   assert.ok(r.players.every(p=>p.points===null));
  }
 }
 assert.equal(selectLoogScores({latest,completed,now:Date.parse('2026-10-29T12:10:00Z')}).week,8);
});
test('corrected finals reconcile records, PF/PA and history while retaining original roster evidence and all earlier weeks',()=>{
 for(const [slug,t] of Object.entries(current.teams)){
  const old=prior.teams[slug],st=source.standings.find(s=>s.teamId===t.teamId);
  assert.equal(t.record,`${st.wins}-${st.losses}`);assert.equal(t.pointsFor,st.pointsFor);assert.equal(t.pointsAgainst,st.pointsAgainst);
  assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.score,0)),round(t.pointsFor));
  assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.opponentScore,0)),round(t.pointsAgainst));
  assert.deepEqual(t.season.weekly.slice(0,6),old.season.weekly.slice(0,6));
  assert.deepEqual(t.roster,old.roster);assert.deepEqual(t.season.positionTotals,old.season.positionTotals);
  assert.equal(t.season.weekly.at(-1).result,old.season.weekly.at(-1).result);
 }
 assert.equal(current.teams['kupp-doubs'].matchup.score,136.42);
 assert.equal(current.teams['kupp-doubs'].season.unattributedScoreCorrection,0.5);
 assert.equal(round(current.teams['kupp-doubs'].pointsFor),990.20);
 assert.equal(round(current.teams['pollard-greens'].pointsAgainst),938.94);
 assert.equal(completed.week,7);assert.equal(completed.matchups.find(g=>g.away.id===1).away.score,136.42);
 assert.match(current.sourceEvidence.rosterPointsNote,/does not identify a player/);
});
test('route gates Week 8 evidence by season and week and reports retrieval freshness without adding draft columns',()=>{
 const page=fs.readFileSync('app/matchups/[a]/[b]/page.js','utf8');
 assert.match(page,/Number\(latest.season\)===week8Verified.season&&Number\(latest.week\)===week8Verified.week/);
 assert.match(page,/week8Matches\?week8Verified.rosters/);
 assert.match(page,/PROVIDER-VERIFIED SELECTIONS/);assert.match(page,/Player points unavailable/);
 assert.doesNotMatch(page,/week8-matchup-columns|week8-preview/);
});
