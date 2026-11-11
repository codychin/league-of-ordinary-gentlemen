import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {leagueSnapshot} from '../app/teams/league-data.js';
import {loogArchivedScores} from '../lib/loog-archived-scores.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
test('Week9 active scoreboard preserves six mirrored Week8 archived results',()=>{
 const weeks=loogArchivedScores(leagueSnapshot,9);
 assert.deepEqual(weeks.map(w=>w.week),[8,7,6,5,4]);
 assert.equal(weeks[0].games.length,6);
 const g=weeks[0].games.find(g=>g.teamSlug==='lloyd-rings'||g.opponentSlug==='lloyd-rings');
 assert.ok([g.score,g.opponentScore].includes(141.05));
});
test('Week8 correction preserves original evidence and reconciles changed player, result and cumulative totals',()=>{
 const c=read('data/week8-loog-stat-correction.json');
 const prior=read('data/week8-loog-snapshot.json');
 assert.equal(c.priorPlayerMatchup.home.totalPoints,140.3);
 assert.equal(c.correctedPlayerMatchup.home.totalPoints,141.05);
 assert.equal(c.changes.length,1);assert.equal(c.changes[0].playerName,'Michael Wilson');
 assert.equal(prior.teams['lloyd-rings'].pointsFor,1065.45);
 assert.equal(prior.teams['route-22'].pointsAgainst,1069.47);
 assert.equal(prior.teams['lloyd-rings'].record,'4-4');
});
test('all twelve Week9 LOOG roster sources are explicitly week-scoped',()=>{
 const data=read('data/week9-loog-rosters.json');assert.equal(data.week,9);assert.equal(data.season,2026);
 assert.equal(new Set(data.teams.map(t=>t.teamId)).size,12);
 for(const t of data.teams){assert.equal(t.snapshot.week,9);assert.ok(t.weeklyPlayers.length>0);}
});
test('Yahoo Week8 archive preserves all six matchups and twelve rosters independently',()=>{
 const a=read('data/week8-edition-archives.json');
 for(const slug of ['doge','sunday-crew']){const s=a[slug].snapshots;assert.equal(a[slug].week,8);assert.equal(s.matchups.data.data.matchupWeek,8);assert.equal(s.matchups.data.data.matchups.length,6);assert.equal(s.rosters.data.data.length,12);}
 assert.notEqual(a.doge.snapshots.matchups.league_id,a['sunday-crew'].snapshots.matchups.league_id);
});
test('stable identity routing survives provider team renames and historical links carry week',()=>{
 const source=readFileSync('app/components/LiveWeek3Surfaces.jsx','utf8');assert.match(source,/idSlugs\[g.home\?\.id\]/);assert.match(source,/11:'lloyd-rings'/);
 for(const path of ['app/page.js','app/components/EditionScoreboard.jsx'])assert.match(readFileSync(path,'utf8'),/\?week=/);
 for(const path of ['app/matchups/[a]/[b]/page.js','app/components/editions/Matchup.js'])assert.match(readFileSync(path,'utf8'),/await searchParams/);
});

test('dynamic lineups reject mismatched week or actual starter sums',async()=>{
 const {selectCurrentLineups}=await import('../lib/select-current-lineups.mjs');
 const teams=read('data/week9-loog-rosters.json').teams.slice(0,2).map(t=>({id:t.teamId,roster:t.weeklyPlayers.map(p=>({id:p.playerId,name:p.name,slot:p.lineupSlot,started:p.started,weekPoints:p.points}))}));
 const actual=t=>t.roster.filter(p=>p.started).reduce((n,p)=>n+p.weekPoints,0);
 const game={home:{id:teams[0].id,score:actual(teams[0])},away:{id:teams[1].id,score:actual(teams[1])}};
 const d={ok:true,season:2026,week:9,teams};assert.equal(selectCurrentLineups(d,9,game).length,2);assert.equal(selectCurrentLineups(d,8,game).length,0);
 d.teams[0].roster.find(p=>p.started).weekPoints+=5;assert.equal(selectCurrentLineups(d,9,game).length,1);
});
