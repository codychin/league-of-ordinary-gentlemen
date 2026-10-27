import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {leagueSnapshot as current} from '../app/teams/league-data.js';
import {selectLoogScores} from '../lib/select-loog-scores.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const prior=read('week6-loog-snapshot.json');
const source=read('week7-loog-source/01-final-standings-history.json');
const manifest=read('week7-loog-source/manifest.json');
const rosters=manifest.files.slice(1).flatMap(f=>read('week7-loog-source/'+f.file).rosters);
const latest=read('latest-loog-scores.json'),completed=read('completed-loog-scores.json');
const round=n=>Math.round(n*100)/100;
const byId=id=>Object.values(current.teams).find(t=>t.teamId===id);

test('all four final source files match the exact supplied byte hashes and canonical LOOG identity',()=>{
  for (const item of manifest.files) {
    const bytes=fs.readFileSync('data/week7-loog-source/'+item.file);
    assert.equal(bytes.length,item.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
    assert.equal(bytes.at(-1),10);
  }
  assert.equal(source.identity.providerLeagueId,'310731');
  assert.equal(source.identity.leagueUuid,'65c573a0-535d-4edf-8332-2522ee13872f');
  assert.equal(source.identity.status,'FINAL');
  assert.equal(source.identity.completedWeek,7);
  assert.equal(source.identity.providerCurrentWeek,8);
  assert.equal(rosters.length,12);
  assert.equal(rosters.reduce((n,r)=>n+r.players.length,0),201);
});

test('all 12 records, PF/PA, six pairings and 201 actual player rows reconcile without projections',()=>{
  assert.equal(current.week,7);
  assert.equal(current.sourceEvidence.providerCurrentWeek,8);
  assert.deepEqual(latest,completed);
  assert.equal(latest.matchups.length,6);
  for (const st of source.standings) {
    const t=byId(st.teamId),r=rosters.find(r=>r.teamId===st.teamId);
    assert.equal(t.record,`${st.wins}-${st.losses}`);
    assert.equal(st.wins+st.losses+st.ties,7);
    assert.equal(t.seed,st.playoffSeed);
    assert.equal(t.pointsFor,st.pointsFor);
    assert.equal(t.pointsAgainst,st.pointsAgainst);
    assert.equal(t.season.completedGames,7);
    assert.equal(t.season.weekly.length,7);
    assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.score,0)),round(st.pointsFor));
    assert.equal(round(t.season.weekly.reduce((n,w)=>n+w.opponentScore,0)),round(st.pointsAgainst));
    assert.equal(round(Object.values(t.season.positionTotals).reduce((a,b)=>a+b,0)),round(st.pointsFor));
    assert.equal(round(r.players.filter(p=>p.started).reduce((n,p)=>n+p.points,0)),r.actualTotal);
    assert.equal(t.matchup.score,r.actualTotal);
    assert.equal(t.matchup.projection,null);
    assert.equal(t.roster.length,r.players.length);
    for (const p of r.players) {
      const stored=t.roster.find(x=>x.id===p.playerId);
      assert.equal(stored.weekPoints,p.points);
      assert.equal(stored.slot,p.lineupSlot);
      assert.equal(stored.name,p.name);
    }
  }
  for (const g of source.week7History) {
    const stored=latest.matchups.find(x=>x.id===g.id);
    assert.equal(stored.winner,g.winner);
    for (const side of ['home','away']) {
      assert.equal(stored[side].id,g[side].teamId);
      assert.equal(stored[side].score,g[side].totalPoints);
      assert.equal(stored[side].projection,undefined);
      const team=byId(g[side].teamId),opponent=g[side==='home'?'away':'home'];
      assert.equal(team.season.weekly.at(-1).opponentSlug,Object.keys(current.teams).find(k=>current.teams[k].teamId===opponent.teamId));
      assert.equal(team.matchup.opponentScore,opponent.totalPoints);
    }
  }
});

test('weeks 1–6 and retained player metadata remain unchanged; missing metadata stays unknown',()=>{
  for (const [slug,old] of Object.entries(prior.teams)) {
    const t=current.teams[slug];
    assert.equal(t.teamId,old.teamId);
    assert.deepEqual(t.moves,old.moves);
    assert.deepEqual(t.season.weekly.slice(0,6),old.season.weekly);
    assert.equal(t.rosterCumulativeThroughWeek,old.rosterCumulativeThroughWeek);
    for (const p of t.roster) {
      const was=old.roster.find(x=>x.id===p.id);
      for (const key of ['position','team','starts','seasonPoints']) assert.equal(p[key],was?.[key]??null);
      if (was) assert.equal(p.status,was.status);
    }
  }
});

const next={...latest,week:8,status:'PREGAME',updatedAt:'2026-10-27T09:00:00Z',matchups:[{status:'PREGAME',winner:'UNDECIDED',home:{id:1,score:0},away:{id:2,score:0}}]};
test('completed Week 7 holds through Wednesday in the publication timezone, then allows a verified Week 8 snapshot',()=>{
  assert.equal(completed.displayTimeZone,'America/New_York');
  for (const time of ['2026-10-27T12:00:00Z','2026-10-28T23:59:59Z','2026-10-29T03:59:59Z'])
    assert.equal(selectLoogScores({provider:next,latest,completed,now:Date.parse(time)}).week,7);
  assert.equal(selectLoogScores({provider:next,latest,completed,now:Date.parse('2026-10-29T04:00:00Z')}).week,8);
  assert.equal(selectLoogScores({latest,completed,now:Date.parse('2026-10-29T05:00:00Z')}).week,7,'No invented next-week data');
});

test('same-week corrections win; older, wrong-season and malformed responses never replace current scores',()=>{
  const now=Date.parse('2026-10-27T12:00:00Z');
  const correction={...latest,updatedAt:'2026-10-27T10:00:00Z'};
  assert.equal(selectLoogScores({provider:correction,latest,completed,now}),correction);
  for (const provider of [{...latest,week:6},{...next,season:2025},{...next,matchups:[]},{...next,ok:false},null])
    assert.equal(selectLoogScores({provider,latest,completed,now}),latest);
});

test('API and matchup pages share week selection and use exact-week lineup evidence',()=>{
  for (const p of ['app/api/live-scores/route.js','app/matchups/[a]/[b]/page.js'])
    assert.match(fs.readFileSync(p,'utf8'),/selectLoogScores\(\{provider/);
  const page=fs.readFileSync('app/matchups/[a]/[b]/page.js','utf8');
  assert.match(page,/Number\(latest.week\)===7\?week7Rosters/);
});
