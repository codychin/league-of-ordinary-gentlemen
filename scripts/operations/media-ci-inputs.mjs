#!/usr/bin/env node
// Read-only checkout plan. Real decode fixtures still run; no generated test doubles.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function mediaCiInputs(root=process.cwd()) {
  const read=name=>JSON.parse(readFileSync(resolve(root,name),'utf8'));
  const shelf=read('data/week7-approved-homepage-media.json');
  const assets=read('qa/week7-recap-assets.json');
  // The integration loop uses DOGE; two interruption/resume tests use fixture().
  const ids=[...new Set([...shelf.filter(row=>row.edition==='doge').map(row=>row.id),assets.bindings[0]?.videoId])].sort();
  assert.equal(shelf.filter(row=>row.edition==='doge').length,6,'Expected complete six-video fixture');
  for(const id of ids)assert.match(id||'',/^[a-f0-9]{32}$/,'Invalid real-media fixture identity');
  return [
    '/scripts/operations/',
    '/qa/operations/media-preparation.test.mjs',
    '/qa/fixtures/media-preparation.mjs',
    '/qa/week7-recap-assets.json',
    '/qa/week7-recap-draft.json',
    '/qa/week8-owner-playback-waiver.json',
    // Optional for historical bases before recap publication. Git sparse patterns
    // may name a missing file; current recap releases require this dependency.
    '/qa/week8-recap-owner-playback-waiver.json',
    '/data/week7-approved-homepage-media.json',
    '/lib/week7-reels.js',
    '/app/articles/writers.js',
    '/app/components/ReelsShelf.jsx',
    ...ids.flatMap(id=>[`/public/reels/${id}.mp4`,`/public/reels-hls/${id}/`]),
  ];
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(mediaCiInputs().join('\n'));
