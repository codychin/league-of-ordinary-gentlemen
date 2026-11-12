import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {leagueSnapshot as current} from '../app/teams/league-data.js';
import {selectLoogScores} from '../lib/select-loog-scores.mjs';
import {selectCurrentLineups} from '../lib/select-current-lineups.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const prior=read('week8-loog-snapshot.json'), source=read('week9-loog-final-evidence.json');
const completed=read('completed-loog-scores.json'), latest=read('completed-loog-scores.json'), rosters=read('week9-loog-rosters.json');
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const byId=id=>Object.values(current.teams).find(t=>t.teamId===id);
const sides=source.playerMatchups.flatMap(g=>[g.home,g.away]);

test('Week 9 uses one final provider snapshot for scores, records, standings and cumulative history',()=>{
 assert.equal(current.week,9);assert.equal(source.week,9);assert.equal(source.season,2026);assert.equal(source.leagueId,'310731');
 assert.equal(source.providerCurrentWeek,10);assert.equal(source.displayCurrentWeek,9);assert.equal(source.standings.length,12);
 assert.equal(source.matchups.length,6);assert.equal(sides.length,12);assert.deepEqual(latest,completed);
 for(const st of source.standings){
  const t=byId(st.teamId), rows=t.season.weekly;
  assert.equal(t.record,`${st.wins}-${st.losses}${st.ties?'-'+st.ties:''}`);assert.equal(st.wins+st.losses+st.ties,9);
  assert.equal(t.seed,st.playoffSeed);assert.equal(t.projectedRank,st.currentProjectedRank);
  assert.equal(t.pointsFor,round(st.pointsFor));assert.equal(t.pointsAgainst,round(st.pointsAgainst));
  assert.equal(t.season.completedGames,9);assert.equal(rows.length,9);assert.equal(new Set(rows.map(w=>w.week)).size,9);
  assert.equal(rows.filter(w=>w.result==='W').length,st.wins);assert.equal(rows.filter(w=>w.result==='L').length,st.losses);assert.equal(rows.filter(w=>w.result==='T').length,st.ties);
  assert.equal(round(rows.reduce((n,w)=>n+w.score,0)),t.pointsFor);assert.equal(round(rows.reduce((n,w)=>n+w.opponentScore,0)),t.pointsAgainst);
  assert.equal(round(Object.values(t.season.positionTotals).reduce((a,b)=>a+b,0)),t.pointsFor);assert.equal(t.season.startedPoints,t.pointsFor);
  assert.equal(t.season.ppg,round(t.pointsFor/9));
  assert.equal(t.season.pfRank,1+source.standings.filter(x=>x.pointsFor>st.pointsFor).length);
  assert.equal(t.season.paRank,1+source.standings.filter(x=>x.pointsAgainst>st.pointsAgainst).length);
 }
});

test('all 12 completed lineups reconcile exactly, with projections excluded and unknown cumulative metadata preserved',()=>{
 const details={ok:true,season:2026,week:9,teams:Object.values(current.teams).map(t=>({id:t.teamId,roster:t.roster.map(p=>({...p,started:!['Bench','IR'].includes(p.slot)}))}))};
 for(const g of source.matchups){
  const saved=completed.matchups.find(x=>x.home.id===g.home.teamId&&x.away.id===g.away.teamId);
  assert.ok(saved);assert.equal(saved.status,'FINAL');assert.equal(saved.winner,g.winner);assert.notEqual(g.winner,'UNDECIDED');
  assert.equal(selectCurrentLineups(details,9,saved).length,2);
  for(const side of ['home','away'])assert.equal(saved[side].score,g[side].totalPoints);
 }
 for(const [slug,t] of Object.entries(current.teams)){
  const old=prior.teams[slug],side=sides.find(s=>s.teamId===t.teamId), stored=rosters.teams.find(s=>s.teamId===t.teamId);
  assert.equal(side.players.filter(p=>p.started).length,10);assert.equal(round(side.players.filter(p=>p.started).reduce((n,p)=>n+p.points,0)),side.totalPoints);
  assert.equal(t.matchup.score,side.totalPoints);assert.equal(t.matchup.projection,null);assert.equal(t.matchup.opponentProjection,null);
  assert.equal(stored.snapshot.week,9);assert.deepEqual(stored.weeklyPlayers,side.players);assert.equal(t.roster.length,side.players.length);
  assert.equal(t.rosterCumulativeThroughWeek,old.rosterCumulativeThroughWeek);
  assert.equal(t.season.benchPoints,round(old.season.benchPoints+side.players.filter(p=>!p.started).reduce((n,p)=>n+p.points,0)));
  for(const p of side.players){const s=t.roster.find(x=>x.id===p.playerId), was=old.roster.find(x=>x.id===p.playerId);assert.equal(s.name,p.name);assert.equal(s.weekPoints,p.points);assert.equal(s.slot,p.lineupSlot);for(const k of ['team','starts','seasonPoints'])assert.equal(s[k],was?.[k]??null);}
 }
 assert.equal(rosters.status,'FINAL');assert.equal(rosters.updatedAt,source.capturedAt);
});

test('every prior weekly result and transaction survives unchanged and each final is mirrored exactly once',()=>{
 for(const [slug,old] of Object.entries(prior.teams)){
  const t=current.teams[slug];assert.deepEqual(t.season.weekly.slice(0,8),old.season.weekly);assert.deepEqual(t.moves,old.moves);
  for(const row of t.season.weekly){const mirror=current.teams[row.opponentSlug].season.weekly.filter(w=>w.week===row.week);assert.equal(mirror.length,1);assert.equal(mirror[0].opponentSlug,slug);assert.equal(mirror[0].score,row.opponentScore);assert.equal(mirror[0].opponentScore,row.score);}
 }
 assert.deepEqual(current.sourceEvidence.corrections.slice(0,prior.sourceEvidence.corrections.length),prior.sourceEvidence.corrections);
 assert.equal(current.teams['lloyd-rings'].teamId,11);assert.equal(current.teams['lloyd-rings'].teamName,'New Team Name');
 assert.equal(current.teams['lloyd-rings'].season.weekly[7].score,141.05);
});

test('completed Week 9 is held through Wednesday New York time and allows Week 10 only on Thursday',()=>{
 assert.equal(completed.week,9);assert.equal(completed.displayTimeZone,'America/New_York');assert.equal(completed.displayCompletedUntil,'2026-11-12T05:00:00Z');
 const next={ok:true,season:2026,week:10,updatedAt:'2026-11-10T10:00:00Z',matchups:[{status:'PREGAME',winner:'UNDECIDED',home:{id:1,score:0},away:{id:2,score:0}}]};
 for(const now of ['2026-11-10T10:00:00Z','2026-11-12T04:59:59Z'])assert.equal(selectLoogScores({provider:next,latest,completed,now:Date.parse(now)}).week,9);
 assert.equal(selectLoogScores({provider:next,latest,completed,now:Date.parse('2026-11-12T05:00:00Z')}).week,10);
 assert.equal(selectLoogScores({latest,completed,now:Date.parse('2026-11-12T06:00:00Z')}).week,9);
});

test('team pages derive their current data from the same snapshot and final lineup fallback shows its actual timestamp',()=>{
 const teamData=fs.readFileSync('app/teams/data.js','utf8');assert.match(teamData,/const ops=leagueSnapshot\.teams\[t.id\]/);assert.match(teamData,/record:ops.record,pf:ops.pointsFor.toFixed\(2\),pa:ops.pointsAgainst.toFixed\(2\)/);
 const page=fs.readFileSync('app/matchups/[a]/[b]/page.js','utf8');assert.match(page,/week9Rosters.updatedAt\|\|week9Rosters.retrievedDateUTC/);assert.match(page,/PROVIDER-VERIFIED FINAL/);
});
