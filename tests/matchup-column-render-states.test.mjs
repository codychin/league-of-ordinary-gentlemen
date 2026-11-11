import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseDocument} from 'htmlparser2';
import {renderMatchupColumn} from '../qa/fixtures/render-matchup-column.mjs';
const columns=JSON.parse(readFileSync(new URL('../data/week9-matchup-columns.json',import.meta.url)));
const text=n=>n.type==='text'?n.data:(n.children||[]).map(text).join('');
const find=(n,p)=>p(n)?n:(n.children||[]).map(c=>find(c,p)).find(Boolean);
function content(html){const section=find(parseDocument(html),n=>n.attribs?.class==='matchupColumn');assert.ok(section);return {headline:text(find(section,n=>n.name==='h2')),body:section.children.filter(n=>n.name==='p'&&n.attribs?.class!=='matchupUpdated').map(text)};}
for(const edition of ['loog','sunday-crew','doge'])test(`${edition} production component renders every pregame and both final states`,async()=>{
 const pairs=columns.filter(c=>c.edition===edition);assert.equal(pairs.length,6);
 for(const c of pairs){
  assert.deepEqual(content(await renderMatchupColumn(c)),{headline:c.headline,body:c.body.split(/\n\n+/)});
  assert.deepEqual(content(await renderMatchupColumn(c,{final:true})),{headline:'Awaiting correspondent recap',body:['The result is final. The correspondent recap is awaiting publication.']});
  const recap={...c,kind:'recap',headline:`QA FINAL ${edition} ${c.teamIds.join('/')}`,body:'QA final first paragraph.\n\nQA final second paragraph.'};
  // A neighboring recap must not satisfy this pairing.
  const neighbor={...recap,teamIds:['99','100'],headline:'WRONG PAIR'};
  assert.deepEqual(content(await renderMatchupColumn(c,{final:true,recaps:[neighbor,recap]})),{headline:recap.headline,body:recap.body.split(/\n\n+/)});
 }
});
