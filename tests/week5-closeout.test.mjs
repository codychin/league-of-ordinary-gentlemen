import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const leagueSnapshot=JSON.parse(fs.readFileSync('data/week5-loog-snapshot.json'));
import {isMatchupFinal} from '../lib/matchup-status.mjs';
const evidence=JSON.parse(fs.readFileSync('data/week5-closeout.json'));
const scores=JSON.parse(fs.readFileSync('data/week5-loog-scores.json'));
const round=n=>Math.round(n*100)/100;
test('Yahoo leaders are not final while the provider says in progress',()=>{
 assert.equal(isMatchupFinal({status:'in_progress',winner:'home'}),false);
 assert.equal(isMatchupFinal({status:'in_progress',winner:'HOME'}),false);
 assert.equal(isMatchupFinal({status:'final',winner:'away'}),true);
 assert.equal(isMatchupFinal({winner:'UNDECIDED'}),false);
 assert.equal(isMatchupFinal({winner:'AWAY'}),true);
});
test('all 36 Week 5 starter sums reconcile with the posted scores',()=>{
 for(const edition of [evidence.sundayCrew,evidence.doge]){
  assert.equal(edition.rosters.length,12);
  for(const game of edition.matchups.matchups)for(const side of [game.home,game.away]){
   const roster=edition.rosters.find(r=>r.teamKey===side.teamKey);
   assert.equal(roster.snapshot.week,5);
   assert.equal(round(roster.players.filter(p=>!['BN','IR','IR+'].includes(p.selectedPosition)).reduce((sum,p)=>sum+p.points,0)),side.points);
  }
 }
 for(const game of evidence.loog.details)for(const side of [game.home,game.away]){
  const stored=scores.matchups.flatMap(m=>[m.home,m.away]).find(t=>t.id===side.teamId);
  const source=evidence.loog.matchups.matchups.flatMap(m=>[m.home,m.away]).find(t=>t.teamId===side.teamId);
  assert.equal(stored.score,round(side.players.filter(p=>p.started).reduce((sum,p)=>sum+p.points,0)));
  assert.equal(stored.score,source.pointsByScoringPeriod['5']);
 }
});
test('completed Week 5 records and winners reconcile to provider evidence',()=>{
 for(const edition of [evidence.loog,evidence.sundayCrew,evidence.doge]){
  assert.equal(edition.standings.standings.length,12);
  for(const t of edition.standings.standings)assert.equal(Number(t.wins)+Number(t.losses)+Number(t.ties),5);
  assert.ok(edition.matchups.matchups.every(isMatchupFinal));
 }
 assert.equal(scores.status,'FINAL');
 assert.ok(scores.matchups.every(isMatchupFinal));
 for(const st of evidence.loog.standings.standings){
  const t=Object.values(leagueSnapshot.teams).find(t=>t.teamId===st.teamId);
  assert.equal(t.record,`${st.wins}-${st.losses}`);
  assert.equal(t.season.weekly.length,5);
  assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.score,0)),round(st.pointsFor));
  const source=evidence.loog.matchups.matchups.find(m=>m.home.teamId===st.teamId||m.away.teamId===st.teamId);
  const stored=scores.matchups.find(m=>m.home.id===st.teamId||m.away.id===st.teamId);
  assert.equal(stored.winner,source.winner);
 }
});
