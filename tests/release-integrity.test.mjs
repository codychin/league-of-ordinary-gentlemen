import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const exists=p=>fs.existsSync(new URL('../'+p,import.meta.url));
const page=read('app/page.js');
const reels=read('app/components/ReelsShelf.jsx');
const scores=read('app/components/LiveWeek3Surfaces.jsx');
const sunday=read('app/sunday-crew/page.js');

test('production JSX never contains escaped newline artifacts',()=>assert.equal(page.includes('\\n{'),false));
test('current matchup surface is not deliberately suppressed',()=>assert.equal(page.includes('<LiveWeek3Surfaces finalWeek={true}'),false));
test('reels require all delivery assets before display',()=>{
  assert.match(reels,/checks\.every\(Boolean\)/); assert.match(reels,/if\(!releaseReady\)return null/);
  for(const x of ['index.m3u8','poster.jpg','seg_000.m4s']) assert.ok(reels.includes(x));
});
test('view state is supplied per release rather than hard-coded globally',()=>{
  assert.match(reels,/storageKey=/); assert.match(reels,/releaseId=/);
  assert.match(sunday,/sunday-crew-week4-preview-v1/); assert.match(sunday,/brief-sunday-crew-week4-preview-viewed-v1/);
});
test('Week 4 score surface has no stale Week 3 labels',()=>{
  assert.match(scores,/THE BRIEF • WEEK 4/); assert.match(scores,/<h2>Week 4<\/h2>/); assert.equal(scores.includes('THE BRIEF • WEEK 3'),false);
});
test('Sunday Crew release has six unique approved reels with complete packaged assets',()=>{
  const ids=[...sunday.matchAll(/id:'([a-f0-9]{32})'/g)].map(m=>m[1]);
  assert.equal(ids.length,6); assert.equal(new Set(ids).size,6);
  for(const id of ids){
    assert.ok(exists('public/reels/'+id+'.mp4'),id+' mp4 missing');
    for(const f of ['index.m3u8','poster.jpg','seg_000.m4s']) assert.ok(exists('public/reels-hls/'+id+'/'+f),id+' '+f+' missing');
  }
});


test('mobile web nav handles Home and Scores explicitly instead of falling through to stale client state',()=>{
  const shell=read('app/components/PwaShell.jsx');
  assert.match(shell,/if\(!standalone\)\{/);
  assert.match(shell,/window\.history\.replaceState\(window\.history\.state,'',homePath\)/);
  assert.match(shell,/document\.getElementById\(item\.hash\.slice\(1\)\)\?\.scrollIntoView/);
});

test('Sunday Crew scoreboard uses the stable edition score grid and not experimental upcoming-grid markup',()=>{
  const board=read('app/components/EditionScoreboard.jsx');
  assert.match(board,/editionScoreGrid/);
  assert.match(board,/editionCardTeams/);
  assert.match(board,/editionCardPortraits/);
  assert.equal(board.includes('editionUpcomingGrid'),false);
  assert.equal(board.includes('editionCardContent'),false);
});
