import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectLoogScores} from '../lib/select-loog-scores.mjs';
import {leagueSnapshot} from '../app/teams/league-data.js';
const read=p=>JSON.parse(fs.readFileSync('data/'+p));
const latest=read('latest-loog-scores.json'),completed=read('completed-loog-scores.json'),lineups=read('week10-loog-selected-lineups.json'),archives=read('week9-edition-archives.json');
test('new exact-week slate is selected without erasing completed Week 9 or cumulative history',()=>{
 assert.equal(latest.week,10);assert.equal(completed.week,9);assert.equal(leagueSnapshot.week,9);
 assert.equal(selectLoogScores({latest,completed,now:Date.parse('2026-11-12T13:05:41Z')}).week,10);
 assert.deepEqual(latest.matchups.map(g=>[g.home.id,g.away.id]),[[5,8],[11,10],[1,12],[6,2],[9,7],[3,4]]);
 assert.equal(new Set(latest.matchups.flatMap(g=>[g.home.id,g.away.id])).size,12);
 for(const g of latest.matchups){assert.ok(Number.isFinite(g.home.score));assert.ok(Number.isFinite(g.away.score));assert.equal(g.winner,'UNDECIDED');}
 for(const t of Object.values(leagueSnapshot.teams)){assert.equal(t.season.weekly.length,9);assert.equal(t.season.completedGames,9);}
 assert.equal(lineups.week,10);assert.equal(lineups.teams.length,12);
 for(const t of lineups.teams){const g=latest.matchups.find(g=>g.home.id===t.teamId||g.away.id===t.teamId);const side=g.home.id===t.teamId?g.home:g.away;const sum=t.players.filter(p=>p.started).reduce((n,p)=>n+p.points,0);assert.ok(Math.abs(sum-side.score)<0.001);}
 assert.ok(latest.matchups.some(g=>g.home.score>0||g.away.score>0),'Thursday actuals must not be erased');
});
test('Yahoo archived Week 9 retains exact final pairings and exact-week player totals',()=>{
 for(const [slug,e] of Object.entries(archives)){
  assert.equal(e.week,9);const games=e.snapshots.matchups.data.data.matchups,rosters=e.snapshots.rosters.data.data;
  assert.equal(games.length,6);assert.equal(rosters.length,12);
  for(const g of games){assert.equal(g.status,'final');for(const side of [g.home,g.away]){const r=rosters.find(r=>r.teamKey===side.teamKey);assert.equal(r.snapshot.week,9);const sum=r.players.filter(p=>!['BN','IR'].includes(p.selectedPosition)).reduce((n,p)=>n+p.points,0);assert.ok(Math.abs(sum-side.points)<0.001,slug+' lineup sum');}}
 }
 const page=fs.readFileSync('app/components/editions/Matchup.js','utf8');assert.match(page,/week9ArchivedEditions\[editionSlug\]/);
});
