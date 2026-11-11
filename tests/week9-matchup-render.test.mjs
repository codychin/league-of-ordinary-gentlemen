import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {week9Columns,recapFor,renderWeek9Matchup} from '../qa/fixtures/week9-matchup-render.mjs';
const tag=(name,text)=>renderToStaticMarkup(React.createElement(name,null,text));
for(const phase of ['pregame','final'])for(const edition of ['loog','sunday-crew','doge'])test(`${edition} actual matchup component selects exact Week 9 ${phase} text for all six pairs`,async()=>{
 const columns=week9Columns.filter(c=>c.edition===edition);assert.equal(columns.length,6);
 for(const c of columns){
  const previous=globalThis.fetch,html=await renderWeek9Matchup(c,phase);
  assert.equal(globalThis.fetch,previous,'fixture must restore fetch');
  const selected=phase==='pregame'?c:recapFor(c);
  assert.ok(html.includes(tag('h2',selected?.headline||'Awaiting correspondent recap')));
  for(const p of (selected?.body||'The result is final. The correspondent recap is awaiting publication.').split(/\n\n+/))assert.ok(html.includes(tag('p',p)));
  for(const other of columns.filter(x=>x!==c))assert.ok(!html.includes(tag('h2',other.headline)),'cross-pair headline leaked');
  if(phase==='pregame')assert.ok(html.includes('UPDATED NOVEMBER 7'));
  else{assert.ok(!html.includes(tag('h2',c.headline)));assert.ok(html.includes('<span>FINAL</span>'));}
 }
});
test('isolated fixture rejects unknown finality instead of silently choosing a lane',async()=>{
 await assert.rejects(renderWeek9Matchup(week9Columns[0],'unknown'),/Unknown fixture phase/);
});
