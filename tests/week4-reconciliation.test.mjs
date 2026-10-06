import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {leagueSnapshot} from '../app/teams/league-data.js';
const evidence=JSON.parse(fs.readFileSync(new URL('../data/week4-verified.json',import.meta.url)));
const round=n=>Math.round(n*100)/100;
test('LOOG team records and all four weekly results reconcile to authenticated standings',()=>{
 for(const st of evidence.loogStandings.standings){
  const t=Object.values(leagueSnapshot.teams).find(t=>t.teamId===st.teamId);
  assert.equal(t.record,`${st.wins}-${st.losses}`);
  assert.equal(t.season.weekly.length,4);
  assert.equal(t.season.weekly.filter(w=>w.result==='W').length,st.wins);
  assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.score,0)),round(st.pointsFor));
  assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.opponentScore,0)),round(st.pointsAgainst));
  assert.equal(round(Object.values(t.season.positionTotals).reduce((n,v)=>n+v,0)),round(st.pointsFor));
  assert.equal(round(t.roster.filter(p=>!['Bench','IR'].includes(p.slot)).reduce((n,p)=>n+p.weekPoints,0)),t.matchup.score);
 }
});
test('Sunday Crew four-week history reconciles to standings for every franchise',()=>{
 for(const st of evidence.sundayStandings.standings){
  const results=evidence.sundayWeeks.map(w=>{
   const g=w.matchups.find(g=>g.home.teamId===st.teamId||g.away.teamId===st.teamId);
   return g.home.teamId===st.teamId?[g.home,g.away]:[g.away,g.home];
  });
  assert.equal(results.filter(([a,b])=>a.points>b.points).length,Number(st.wins));
  assert.equal(round(results.reduce((n,[a])=>n+a.points,0)),Number(st.pointsFor));
  assert.equal(round(results.reduce((n,[,b])=>n+b.points,0)),round(st.pointsAgainst));
 }
});
