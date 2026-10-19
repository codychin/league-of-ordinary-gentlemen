import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const exists=p=>fs.existsSync(new URL('../'+p,import.meta.url));
const page=read('app/page.js');
const reels=read('app/components/ReelsShelf.jsx');
const scores=read('app/components/LiveWeek3Surfaces.jsx');
const editions=read('lib/edition-content.js');
const sunday=read('lib/sunday-reels.js');
// Inspect literal metadata without importing Next's JSX/extensionless module graph.
// Accept both quote styles; validate values separately so malformed IDs cannot
// silently disappear from the release.
const stringProperties=(source,name)=>[...source.matchAll(new RegExp(
  '\\b'+name+'\\s*:\\s*([\\x27"])([^\\x27"]*)\\1','g'
))].map(m=>m[2]);
const assertPackagedFile=path=>{
  assert.ok(exists(path),path+' missing');
  const stat=fs.statSync(new URL('../'+path,import.meta.url));
  assert.ok(stat.isFile()&&stat.size>0,path+' must be a nonempty file');
};

test('production JSX never contains escaped newline artifacts',()=>assert.equal(page.includes('\\n{'),false));
test('current matchup surface is not deliberately suppressed',()=>assert.equal(page.includes('<LiveWeek3Surfaces finalWeek={true}'),false));
test('reels require all delivery assets before display',()=>{
  assert.match(reels,/checks\.every\(Boolean\)/); assert.match(reels,/if\(!releaseReady\)return null/);
  for(const x of ['index.m3u8','poster.jpg','seg_000.m4s']) assert.ok(reels.includes(x));
});
test('view state is supplied per release rather than hard-coded globally',()=>{
  assert.match(reels,/storageKey=/); assert.match(reels,/releaseId=/);
  const releases=stringProperties(editions,'reelRelease');
  const storage=stringProperties(editions,'reelStorage');
  assert.ok(releases.some(id=>id.startsWith('sunday-crew-')),'Sunday Crew release missing');
  assert.equal(new Set(releases).size,releases.length,'release IDs must be unique');
  const expected=releases.map(id=>{
    assert.match(id,/^[a-z][a-z0-9-]*-week[1-9]\d*-(?:preview|recap)-v[1-9]\d*$/);
    return 'brief-'+id.replace(/-v(\d+)$/,'-viewed-v$1');
  });
  assert.deepEqual([...storage].sort(),expected.sort(),'view state must be scoped to each current release');
});
test('Week 4 score surface has no stale Week 3 labels',()=>{
  assert.match(scores,/THE BRIEF • WEEK \{week\}/); assert.match(scores,/<h2>Week \{week\}/); assert.equal(scores.includes('THE BRIEF • WEEK 3'),false);
});
test('Sunday Crew release has six unique approved reels with complete packaged assets',()=>{
  const ids=stringProperties(sunday,'id');
  assert.equal(ids.length,6); assert.equal(new Set(ids).size,6);
  for(const id of ids){
    assert.match(id,/^[a-f0-9]{32}$/);
    assertPackagedFile('public/reels/'+id+'.mp4');
    const base='public/reels-hls/'+id+'/';
    for(const f of ['index.m3u8','poster.jpg','init.mp4','seg_000.m4s']) assertPackagedFile(base+f);
    const manifest=read(base+'index.m3u8');
    assert.match(manifest,/^#EXTM3U/m);
    assert.match(manifest,/#EXT-X-ENDLIST/);
    const segments=manifest.split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#'));
    const maps=[...manifest.matchAll(/#EXT-X-MAP:[^\r\n]*URI="([^"]+)"/g)].map(m=>m[1]);
    assert.ok(segments.length>0,id+' manifest has no segments');
    assert.ok(maps.length>0,id+' manifest has no initialization map');
    for(const file of [...maps,...segments]){
      assert.match(file,/^[a-zA-Z0-9_-]+\.(?:m4s|mp4)$/,'HLS references must stay inside the packaged reel');
      assertPackagedFile(base+file);
    }
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

test('release metadata extraction tolerates formatting without hiding invalid IDs',()=>{
  const id='a'.repeat(32);
  assert.deepEqual(stringProperties("{id:'"+id+"'}, { id : \""+id+"\" }",'id'),[id,id]);
  assert.deepEqual(stringProperties("{id: 'invalid'}",'id'),['invalid']);
  assert.deepEqual(stringProperties("{videoUrl: 'not metadata'}",'id'),[]);
});
