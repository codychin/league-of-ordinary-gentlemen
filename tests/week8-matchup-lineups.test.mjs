import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectVerifiedWeek8Lineups as select} from '../lib/select-verified-week8-lineups.mjs';
const evidence=JSON.parse(readFileSync('data/week8-loog-final-evidence.json','utf8'));
const scores=JSON.parse(readFileSync('data/completed-loog-scores.json','utf8'));
const copy=x=>structuredClone(x);
const pick=(game,opts={})=>select({season:2026,week:8,game,evidence,...opts});

test('all six selected finals display the two evidence-backed starting lineups',()=>{
 for(const game of scores.matchups){
  const sides=pick(game); assert.equal(sides.length,2);
  for(const side of sides){
   const starters=side.players.filter(p=>p.started);assert.equal(starters.length,10);
   const saved=[game.home,game.away].find(s=>s.id===side.teamId);assert.ok(saved);
   assert.equal(Math.round(starters.reduce((n,p)=>n+p.points,0)*100),Math.round(saved.score*100));
  }
 }
});

test('wrong week, pair, score, winner, status or incomplete evidence falls back safely',()=>{
 const game=scores.matchups[0];
 assert.deepEqual(pick(game,{week:9}),[]);assert.deepEqual(pick(game,{season:2025}),[]);
 for(const mutate of [g=>g.home.id=999,g=>g.home.score+=0.01,g=>g.winner='UNDECIDED',g=>g.status='LIVE',g=>g.winner=g.winner==='HOME'?'AWAY':'HOME']){
  const changed=copy(game);mutate(changed);assert.deepEqual(pick(changed),[]);
 }
 for(const mutate of [e=>e.leagueId='wrong',e=>e.week=7,e=>e.playerMatchups[0].home.players.find(p=>p.started).points=null,e=>e.playerMatchups[0].home.players.find(p=>p.started).points+=0.01,e=>e.playerMatchups.push(copy(e.playerMatchups[0]))]){
  const changed=copy(evidence);mutate(changed);assert.deepEqual(pick(game,{evidence:changed}),[]);
 }
});

test('reversing scorecard orientation does not misattribute lineups',()=>{
 const g=copy(scores.matchups[0]);[g.home,g.away]=[g.away,g.home];g.winner=g.winner==='HOME'?'AWAY':g.winner==='AWAY'?'HOME':'TIE';
 assert.equal(pick(g).length,2);
});

test('matchup page retains earlier-week paths and visibly labels safe fallback',()=>{
 const page=readFileSync('app/matchups/[a]/[b]/page.js','utf8');
 assert.match(page,/selectVerifiedWeek8Lineups\(\{season:latest.season,week:latest.week,game,evidence:week8Evidence\}\)/);
 assert.match(page,/Number\(latest.week\)===7\?week7Rosters/);
 assert.match(page,/Number\(latest.week\)===closeout.week\?closeout.loog.details/);
 assert.match(page,/MOST RECENT STORED LINEUPS • NOT VERIFIED FOR WEEK/);
});
