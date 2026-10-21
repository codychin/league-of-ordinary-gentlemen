import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {leagueSnapshot as current} from '../app/teams/league-data.js';
const read=f=>JSON.parse(fs.readFileSync('data/'+f));
const prior=read('week5-loog-snapshot.json'), evidence=read('week6-loog-closeout.json'), scores=read('latest-loog-scores.json');
const round=n=>Math.round(n*100)/100;
test('Week6 is final and remains the displayed completed week despite provider Week7',()=>{
 assert.equal(current.week,6);assert.equal(scores.week,6);assert.equal(scores.status,'FINAL');assert.equal(current.sourceEvidence.providerCurrentWeek,7);
 assert.deepEqual(scores,read('completed-loog-scores.json'));
 assert.equal(scores.matchups.length,6);
});
test('all twelve records, cumulative totals and six actual starting lineups reconcile',()=>{
 for(const st of evidence.loog.standings.standings){
  const [slug,t]=Object.entries(current.teams).find(([,t])=>t.teamId===st.teamId);
  assert.equal(t.record,`${st.wins}-${st.losses}`);assert.equal(st.wins+st.losses+st.ties,6);
  assert.deepEqual(t.season.weekly.slice(0,5),prior.teams[slug].season.weekly);
  assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.score,0)),round(st.pointsFor));
  assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.opponentScore,0)),round(st.pointsAgainst));
  const detail=evidence.loog.details.flatMap(g=>[g.home,g.away]).find(t=>t.teamId===st.teamId);
  const actual=round(detail.players.filter(p=>p.started).reduce((n,p)=>n+p.points,0));
  assert.equal(t.matchup.score,actual);
  const game=scores.matchups.find(g=>g.home.id===st.teamId||g.away.id===st.teamId);
  assert.equal(game.status,'FINAL');assert.ok(['HOME','AWAY','TIE'].includes(game.winner));
  assert.equal((game.home.id===st.teamId?game.home:game.away).score,actual);
  assert.equal(round(Object.values(t.season.positionTotals).reduce((a,b)=>a+b,0)),t.pointsFor);
  assert.equal(t.rosterCumulativeThroughWeek,5);
 }
});
test('provider rename preserves stable franchise ID and route',()=>{
 assert.equal(current.teams['kupp-doubs'].teamId,1);
 assert.equal(current.teams['kupp-doubs'].teamName,"Chat GPT's Chosen Ones");
 assert.match(fs.readFileSync('app/components/LiveWeek3Surfaces.jsx','utf8'),/"Chat GPT's Chosen Ones":"kupp-doubs"/);
});
