import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectMatchupColumn} from '../lib/select-matchup-column.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url)));
const recaps=read('matchup-recaps.json'),picks=read('week10-start-sit.json'),autopsies=read('week10-autopsies.json'),summaries=read('week10-scores-summaries.json');
for(const edition of ['loog','sunday-crew','doge'])test(`${edition} Week 10 complete final written batch and isolated sections`,()=>{
 const ev=read(`week10-${edition}-final-evidence.json`),games=edition==='loog'?ev.matchups:ev.matchups.data.matchups;
 const rows=recaps.filter(x=>x.edition===edition&&x.week===10&&x.season===2026);
 assert.equal(rows.length,6);
 for(const g of games){
  const a=g.home.teamId,b=g.away.teamId,args={recaps,edition,season:2026,week:10,a,b,isFinal:true};
  const row=selectMatchupColumn(args);assert.ok(row);assert.equal(selectMatchupColumn({...args,a:b,b:a}),row);assert.equal(selectMatchupColumn({...args,isFinal:false}),null);
  assert.equal(row.kind,'recap');assert.ok(row.body.split('\n\n').length>=3);assert.ok(row.body.split(/\s+/).length>=190);
  for(const side of [g.home,g.away])assert.equal(row.source.scores.find(s=>s.teamId===String(side.teamId)).points,side.points??side.totalPoints);
  assert.equal(row.source.status,'FINAL');assert.equal(row.script,undefined);assert.equal(row.video,undefined);
 }
 assert.equal(picks[edition].week,10);assert.equal(picks[edition].picks.length,2);assert.equal(picks[edition].status,'FINAL');
 assert.equal(autopsies[edition].week,10);assert.equal(summaries[edition].week,10);assert.ok(!JSON.stringify(summaries[edition]).includes('remain a draft'));
});
test('historical sections stay available, current components point only to Week 10',()=>{
 for(const f of ['start-sit','autopsies','scores-summaries'])assert.ok(read(`week6-${f}.json`));
 for(const f of ['StartSitOfWeek','LoogAutopsy','SundayCrewAutopsy','CompletedScoresSummary'])assert.match(readFileSync(new URL(`../app/components/${f}.jsx`,import.meta.url),'utf8'),/week10-/);
});

test('defense selection does not request an invalid negative player headshot',()=>{
 const component=readFileSync(new URL('../app/components/StartSitOfWeek.jsx',import.meta.url),'utf8');
 assert.match(component,/Number\(p.playerId\)>0/);
 assert.equal(picks.loog.picks[0].playerId,'-16033');
});
