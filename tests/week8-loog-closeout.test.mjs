import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {leagueSnapshot as current} from '../app/teams/league-data.js';
import {selectLoogScores} from '../lib/select-loog-scores.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const prior=read('week7-loog-snapshot.json'), source=read('week8-loog-final-evidence.json');
const completed=read('completed-loog-scores.json'), latest=read('latest-loog-scores.json');
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const byId=id=>Object.values(current.teams).find(t=>t.teamId===id);
const byOldId=id=>Object.values(prior.teams).find(t=>t.teamId===id);
const sides=source.playerMatchups.flatMap(g=>[g.home,g.away]);

test('final standings and lineups reconcile across all twelve teams without projections',()=>{
 assert.equal(current.week,8); assert.equal(current.sourceEvidence.providerCurrentWeek,9);
 assert.equal(source.leagueId,'310731'); assert.equal(source.season,2026); assert.equal(source.week,8);
 assert.equal(source.standings.length,12); assert.equal(source.matchups.length,6); assert.equal(sides.length,12);
 for(const st of source.standings){
  const team=byId(st.teamId),old=byOldId(st.teamId),side=sides.find(x=>x.teamId===st.teamId);
  assert.ok(team&&old&&side); assert.equal(team.record,`${st.wins}-${st.losses}`);assert.equal(st.wins+st.losses+st.ties,8);
  assert.equal(team.seed,st.playoffSeed);assert.equal(round(team.pointsFor),round(st.pointsFor));assert.equal(round(team.pointsAgainst),round(st.pointsAgainst));
  assert.equal(team.season.completedGames,8);assert.equal(team.season.weekly.length,8);assert.equal(team.rosterCumulativeThroughWeek,old.rosterCumulativeThroughWeek);
  assert.equal(round(team.season.weekly.reduce((n,w)=>n+w.score,0)),round(st.pointsFor));
  assert.equal(round(team.season.weekly.reduce((n,w)=>n+w.opponentScore,0)),round(st.pointsAgainst));
  assert.equal(round(Object.values(team.season.positionTotals).reduce((a,b)=>a+b,0)),round(st.pointsFor));
  assert.equal(round(side.players.filter(p=>p.started).reduce((n,p)=>n+p.points,0)),round(side.totalPoints));
  assert.equal(team.matchup.score,side.totalPoints);assert.equal(team.matchup.projection,null);
  assert.equal(team.roster.length,side.players.length);
  for(const p of side.players){const stored=team.roster.find(x=>x.id===p.playerId);const was=old.roster.find(x=>x.id===p.playerId);assert.equal(stored.weekPoints,p.points);assert.equal(stored.slot,p.lineupSlot);assert.equal(stored.name,p.name);for(const k of ['position','team','starts','seasonPoints'])assert.equal(stored[k],was?.[k]??null)}
 }
 for(const g of source.matchups){
  const saved=completed.matchups.find(x=>x.home.id===g.home.teamId&&x.away.id===g.away.teamId); assert.ok(saved);assert.equal(saved.status,'FINAL');assert.equal(saved.winner,g.winner);assert.notEqual(g.winner,'UNDECIDED');
  for(const side of ['home','away'])assert.equal(saved[side].score,g[side].totalPoints);
 }
});

test('the prior Week 7 correction is documented and mirrored, with all other history preserved',()=>{
 const fix=current.sourceEvidence.corrections.find(c=>c.week===7&&c.teamId===1);
 assert.equal(fix.previousScore,135.92);assert.equal(fix.providerScore,136.42);assert.equal(fix.previousPlayerPoints,-2);assert.equal(fix.providerPlayerPoints,-1.5);
 const g=source.week7Correction.data.matchups[0];assert.equal(g.away.teamId,1);assert.equal(g.away.totalPoints,136.42);assert.equal(g.home.teamId,6);
 assert.equal(g.away.players.find(p=>p.name==='49ers D/ST').points,-1.5);
 for(const [slug,old] of Object.entries(prior.teams)){
  const team=current.teams[slug]; assert.deepEqual(team.season.weekly.slice(0,6),old.season.weekly.slice(0,6));
  const before=old.season.weekly[6],after=team.season.weekly[6];
  if(team.teamId===1)assert.deepEqual(after,{...before,score:136.42});else if(team.teamId===6)assert.deepEqual(after,{...before,opponentScore:136.42});else assert.deepEqual(after,before);
  assert.deepEqual(team.moves,old.moves);
 }
});

test('completed Week 8 remains visible through Wednesday in the publication timezone',()=>{
 assert.equal(completed.week,8);assert.equal(completed.displayTimeZone,'America/New_York');assert.equal(completed.displayCompletedUntil,'2026-11-05T05:00:00Z');
 const next={...completed,week:9,status:'PREGAME',updatedAt:'2026-11-03T12:00:00Z',matchups:[{status:'PREGAME',winner:'UNDECIDED',home:{id:1,score:0},away:{id:2,score:0}}]};
 for(const now of ['2026-11-03T12:00:00Z','2026-11-05T04:59:59Z'])assert.equal(selectLoogScores({provider:next,latest,completed,now:Date.parse(now)}).week,8);
 assert.equal(selectLoogScores({provider:next,latest,completed,now:Date.parse('2026-11-05T05:00:00Z')}).week,9);
 assert.equal(selectLoogScores({latest,completed,now:Date.parse('2026-11-05T06:00:00Z')}).week,8);
});
