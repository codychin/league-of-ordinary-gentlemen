import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {leagueSnapshot} from '../app/teams/league-data.js';
import {loogArchivedScores} from '../lib/loog-archived-scores.mjs';

test('all archived weeks between current and Week 3 appear newest first, six final pairs each',()=>{
 const weeks=loogArchivedScores(leagueSnapshot);assert.deepEqual(weeks.map(w=>w.week),[7,6,5,4]);
 for(const week of weeks){
  assert.equal(week.games.length,6); assert.equal(new Set(week.games.flatMap(g=>[g.team,g.opponent])).size,12);
  for(const g of week.games){
   const team=Object.values(leagueSnapshot.teams).find(t=>t.teamName===g.team);
   const row=team.season.weekly.find(w=>w.week===week.week);assert.equal(g.score,row.score);assert.equal(g.opponentScore,row.opponentScore);
  }
 }
 const w7=weeks[0].games.find(g=>g.team==="Chat GPT's Chosen Ones"||g.opponent==="Chat GPT's Chosen Ones");
 assert.ok([w7.score,w7.opponentScore].includes(136.42));assert.ok([w7.score,w7.opponentScore].includes(164.04));
});

test('a missing or inconsistent mirrored result suppresses only that week',()=>{
 const bad=structuredClone(leagueSnapshot);bad.teams['kupp-doubs'].season.weekly.find(w=>w.week===7).score+=1;
 assert.deepEqual(loogArchivedScores(bad).map(w=>w.week),[6,5,4]);
});

test('homepage retains earlier archive notes and corrects only the evidenced Week 1 score',()=>{
 const page=readFileSync('app/page.js','utf8');assert.match(page,/loogArchivedScores\(leagueSnapshot,currentScores.week\)/);assert.match(page,/scores-week3/);assert.match(page,/COKER BENCH ALERT • 37\.8/);assert.match(page,/'131\.22','COKER BENCH ALERT/);
 const fix=leagueSnapshot.sourceEvidence.corrections.find(c=>c.week===1&&c.teamId===5);
 const evidence=JSON.parse(readFileSync('data/week8-loog-final-evidence.json','utf8')).week1DisplayCorrection.data.matchups.find(m=>m.away.teamId===5);
 assert.equal(fix.previousScore,130.72);assert.equal(fix.providerScore,131.22);assert.equal(evidence.away.totalPoints,131.22);
});
