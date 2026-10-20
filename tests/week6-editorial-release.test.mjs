import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectMatchupColumn} from '../lib/select-matchup-column.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url)));
const recaps=read('matchup-recaps.json'), picks=read('week6-start-sit.json'), autopsies=read('week6-autopsies.json'), summaries=read('week6-scores-summaries.json'), approval=read('week6-written-approval.json');
test('18 exact Week6 recaps have unique league/pair identity and four developed paragraphs',()=>{
 const current=recaps.filter(c=>c.week===6); assert.equal(current.length,18);
 for(const edition of ['loog','sunday-crew','doge']){
  const local=current.filter(c=>c.edition===edition);assert.equal(local.length,6);assert.equal(new Set(local.flatMap(c=>c.teamIds)).size,12);
  for(const c of local){assert.equal(c.body.split('\n\n').length,4);assert.ok(c.body.split(/\s+/).length>=200);assert.equal(c.source.status,'FINAL');assert.equal(selectMatchupColumn({recaps,edition,week:6,a:c.teamIds[1],b:c.teamIds[0],isFinal:true}),c);assert.equal(selectMatchupColumn({recaps,edition,week:6,a:c.teamIds[0],b:c.teamIds[1],isFinal:false}),null);}
 }
});
test('all three weekly sections are league-scoped Week6 finals with only written approval',()=>{
 for(const ed of ['loog','sunday-crew','doge']){assert.equal(picks[ed].week,6);assert.equal(picks[ed].picks.length,2);assert.equal(autopsies[ed].week,6);assert.equal(summaries[ed].week,6);assert.equal(picks[ed].status,'FINAL');}
 assert.equal(approval.articles.length,27);assert.equal(approval.scriptsApproved,false);assert.equal(approval.renderingApproved,false);
});
