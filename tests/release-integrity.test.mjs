import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const exists=p=>fs.existsSync(new URL('../'+p,import.meta.url));
const page=read('app/page.js');
const reels=read('app/components/ReelsShelf.jsx');
const scores=read('app/components/LiveWeek3Surfaces.jsx');
const sunday=read('lib/edition-content.js')+read('lib/sunday-reels.js');

test('production JSX never contains escaped newline artifacts',()=>assert.equal(page.includes('\\n{'),false));
test('current matchup surface is not deliberately suppressed',()=>assert.equal(page.includes('<LiveWeek3Surfaces finalWeek={true}'),false));
test('reels require all delivery assets before display',()=>{
  assert.match(reels,/checks\.every\(Boolean\)/); assert.match(reels,/if\(!releaseReady\)return null/);
  for(const x of ['index.m3u8','poster.jpg','seg_000.m4s']) assert.ok(reels.includes(x));
});
test('view state is supplied per release rather than hard-coded globally',()=>{
  assert.match(reels,/storageKey=/); assert.match(reels,/releaseId=/);
  assert.match(sunday,/sunday-crew-week4-recap-v1/); assert.match(sunday,/brief-sunday-crew-week4-recap-viewed-v1/);
});
test('Week 4 score surface has no stale Week 3 labels',()=>{
  assert.match(scores,/THE BRIEF • WEEK \{week\}/); assert.match(scores,/<h2>Week \{week\}/); assert.equal(scores.includes('THE BRIEF • WEEK 3'),false);
});
test('Sunday Crew release has six unique approved reels with complete packaged assets',()=>{
  const ids=[...sunday.matchAll(/id:'([a-f0-9]{32})'/g)].map(m=>m[1]);
  assert.equal(ids.length,6); assert.equal(new Set(ids).size,6);
  for(const id of ids){
    assert.ok(exists('public/reels/'+id+'.mp4'),id+' mp4 missing');
    for(const f of ['index.m3u8','poster.jpg','seg_000.m4s']) assert.ok(exists('public/reels-hls/'+id+'/'+f),id+' '+f+' missing');
  }
});



test('Sunday Crew scoreboard uses the stable edition score grid and not experimental upcoming-grid markup',()=>{
  const board=read('app/components/EditionScoreboard.jsx');
  assert.match(board,/<MatchupCardGrid cards=\{cards\}/);
  const grid=read('app/components/MatchupCardGrid.jsx');
  assert.match(grid,/briefMatchupTeams/);
  assert.match(grid,/briefMatchupPortraits/);
  assert.equal(board.includes('editionUpcomingGrid'),false);
  assert.equal(board.includes('editionCardContent'),false);
});

test('mobile web nav is visible and uses native links',()=>{
  const shell=read('app/components/PwaShell.jsx');
  const css=read('app/pwa.css');
  assert.match(shell,/if\(!standalone\) return/);
  assert.match(css,/\.appTabBar\{[\s\S]*display:grid!important;[\s\S]*visibility:visible!important;/);
});


test('Sunday Crew scoreboard preserves PWA score-section contract',()=>{
  const editionScore=read('app/components/EditionScoreboard.jsx');
  assert.match(editionScore,/className="section scoreSection editionScoreSection" id="scores"/);
});
