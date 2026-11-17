import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {selectWeek10RecapCohort} from '../lib/week10-recap-cohort.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),rows=read('data/week10-recap-approved-homepage-media.json'),authority=read('qa/week10-recap-owner-playback-waiver.json');
test('actual exact Week10 recap cohort binds all eighteen approved assets and distinct complete league batches',()=>{
 for(const edition of ['loog','doge','sunday-crew'])assert.equal(selectWeek10RecapCohort(rows,edition,authority).length,6);
 assert.equal(authority.sourceMessageId,'a37c2dc6-3e8f-438c-8d92-2fca2dcf3647');
 for(const row of rows){assert.equal(row.fullPlaybackInspection,false);assert.equal(row.independentAuditoryListening,false);assert.equal(row.performanceApproval,false);assert.equal(row.scriptSha256,row.renderScriptSha256);}
});
test('all exact original and HLS bytes preserve the native preparation receipt',()=>{
 const files=read('qa/week10-recap-media-integrity.json');assert.equal(files.filter(f=>f.path.endsWith('.mp4')&&f.path.startsWith('public/reels/')).length,18);
 assert.equal(new Set(files.map(f=>f.path)).size,files.length);
 for(const f of files){const bytes=fs.readFileSync(f.path);assert.equal(bytes.length,f.bytes,f.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),f.gitBlobSha,f.path);}
 for(const row of rows){const original=files.find(f=>f.path===`public/reels/${row.id}.mp4`);assert.equal(original.sha256,row.sourceVideoSha256);assert.ok(files.some(f=>f.path===`public/reels-hls/${row.id}/index.m3u8`));}
});
