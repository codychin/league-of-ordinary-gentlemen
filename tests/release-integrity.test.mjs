import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('app/page.js');
const reels=read('app/components/ReelsShelf.jsx');
const scores=read('app/components/LiveWeek3Surfaces.jsx');

test('production JSX never contains escaped newline artifacts',()=>{
  assert.equal(page.includes('\\n{'),false,'literal \\n leaked into page JSX');
});

test('current matchup surface is not deliberately suppressed',()=>{
  assert.equal(page.includes('<LiveWeek3Surfaces finalWeek={true}'),false,'live/current matchup surface is hidden');
});

test('reels fail closed until every delivery asset is ready',()=>{
  assert.match(reels,/checks\.every\(Boolean\)/);
  assert.match(reels,/if\(!releaseReady\)return null/);
  assert.match(reels,/index\.m3u8/);
  assert.match(reels,/poster\.jpg/);
  assert.match(reels,/seg_000\.m4s/);
});

test('reel view state is namespaced to the release',()=>{
  const storage=reels.match(/const STORAGE_KEY='([^']+)'/)?.[1];
  const release=reels.match(/releaseId='([^']+)'/)?.[1];
  assert.ok(storage&&release);
  assert.ok(storage.includes('week4')&&release.includes('week4'));
});

test('score surface labels and data period cannot silently disagree',()=>{
  assert.match(scores,/THE BRIEF • WEEK 4/);
  assert.match(scores,/<h2>Week 4<\/h2>/);
  assert.equal(scores.includes('THE BRIEF • WEEK 3'),false);
});

test('Week 4 release has exactly six unique reel ids and six matchup pairs',()=>{
  const block=page.slice(page.indexOf('const week4Reels=['),page.indexOf('].map(',page.indexOf('const week4Reels=[')));
  const ids=[...block.matchAll(/'([a-f0-9]{32})'/g)].map(m=>m[1]);
  assert.equal(ids.length,6);
  assert.equal(new Set(ids).size,6);
  const pairs=page.match(/const matchupPairs=\[(.*?)\]\n/s)?.[1]||'';
  assert.equal((pairs.match(/\['/g)||[]).length,6);
});
