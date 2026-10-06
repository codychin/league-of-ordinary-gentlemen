import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {editions,editionForPath,editionConfig} from '../lib/editions.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/doge-week4-verified.json',import.meta.url)));
const round=x=>Math.round(x*100)/100;
test('DOGE four-week history reconciles every record, PF, PA and final lineup',()=>{
 assert.equal(data.standings.standings.length,12);
 for(const st of data.standings.standings){
  const results=data.weeks.map(w=>{const m=w.matchups.find(g=>g.home.teamId===st.teamId||g.away.teamId===st.teamId);assert.ok(m);return m.home.teamId===st.teamId?[m.home,m.away]:[m.away,m.home];});
  assert.equal(results.filter(([a,b])=>a.points>b.points).length,Number(st.wins));
  assert.equal(round(results.reduce((n,[a])=>n+a.points,0)),Number(st.pointsFor));
  assert.equal(round(results.reduce((n,[,b])=>n+b.points,0)),round(st.pointsAgainst));
  const roster=data.rosters.find(t=>t.teamKey===st.teamKey);
  assert.equal(round(roster.players.filter(p=>!['BN','IR','IR+'].includes(p.selectedPosition)).reduce((n,p)=>n+p.points,0)),results[3][0].points);
 }
});
test('edition recognition uses exact route boundaries and rejects unknown editions',()=>{
 assert.equal(editionForPath('/doge/articles/global-story').slug,'doge');
 assert.equal(editionForPath('/sunday-crew/teams/10').slug,'sunday-crew');
 assert.equal(editionForPath('/dogecoin'),null);
 assert.equal(editionForPath('/articles/global-story'),null);
 assert.throws(()=>editionConfig('unknown'));
 assert.notEqual(editions.doge.providerLeagueKey,editions['sunday-crew'].providerLeagueKey);
});
test('DOGE autopsy covers all six games exactly once with league-local team IDs',()=>{
 const a=JSON.parse(fs.readFileSync(new URL('../data/doge-autopsy.json',import.meta.url)));
 assert.equal(a.findings.length,6);
 assert.equal(new Set(a.findings.flatMap(f=>f.teams)).size,12);
 for(const f of a.findings)assert.ok(data.weeks[3].matchups.some(g=>f.teams.includes(g.home.teamId)&&f.teams.includes(g.away.teamId)));
});
