import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
import {selectWeek9PreviewCohort} from '../lib/week9-preview-cohort.mjs';
import {restoreWeek9Previews} from '../scripts/restore-week9-previews.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));const manifest=read('data/week9-approved-homepage-media.json'),authority=read('qa/week9-owner-playback-waiver.json');const editions=['loog','doge','sunday-crew'];const hash=b=>createHash('sha256').update(b).digest('hex');
test('all18 Week9 previews bind exact original IDs, scripts and voices without inventing playback approval',()=>{
 assert.equal(manifest.length,18);assert.equal(authority.assets.length,18);
 for(const edition of editions)assert.equal(selectWeek9PreviewCohort(manifest,edition,authority).length,6);
 for(const a of authority.assets){assert.match(a.scriptSha256,/^[a-f0-9]{64}$/);assert.match(a.sourcePackageSha256,/^[a-f0-9]{64}$/);assert.ok(a.voiceId&&a.avatarId);}
});
test('partial or changed Week9 batch fails closed across every edition',()=>{
 for(const rows of [null,{},[],manifest.slice(1),[...manifest,manifest[0]]])for(const edition of editions)assert.deepEqual(selectWeek9PreviewCohort(rows,edition,authority),[]);
 for(const mutate of [r=>r.week=8,r=>r.kind='recap',r=>r.id='0'.repeat(32),r=>r.sourceRevision='other',r=>r.writer='other',r=>r.scriptSha256='f'.repeat(64),r=>r.sourceSha256='f'.repeat(64),r=>r.sourceVideoSha256='f'.repeat(64),r=>r.sourcePackageSha256='f'.repeat(64),r=>r.voiceId='other',r=>r.avatarId='other',r=>r.durationSeconds++,r=>r.publicationApproved=false,r=>r.technicalQaPassed=false,r=>r.fullPlaybackInspection=true,r=>r.independentAuditoryListening=true,r=>r.performanceApproval=true,r=>r.playbackExceptionId='old']){const rows=structuredClone(manifest);mutate(rows[0]);for(const edition of editions)assert.deepEqual(selectWeek9PreviewCohort(rows,edition,authority),[]);}
 const held=structuredClone(authority);held.assets[0].hold=true;assert.deepEqual(selectWeek9PreviewCohort(manifest,'loog',held),[]);
});
test('new preview shelf takes priority while historical clips remain in edition Watch and native global scope stays unchanged',()=>{
 for(const f of ['app/page.js','app/components/editions/Home.js']){const s=fs.readFileSync(f,'utf8');assert.ok(s.indexOf('<ReelsShelf reels={currentPreviewReels}')<s.indexOf('<ReelsShelf reels={currentRecapReels}'));assert.match(s,/currentPreviewReels.length!==6&&currentRecapReels.length===6/);assert.match(s,/Week 9, the previews/);assert.match(s,/week9-preview-viewed-v1/);}
 const s=fs.readFileSync('lib/watch-library.js','utf8');for(const phrase of ['...week9PreviewRows(edition)','...week8RecapRows(edition)','...week8PreviewRows(edition)'])assert.ok(s.includes(phrase));assert.match(fs.readFileSync('native/brief/src/contract.mjs','utf8'),/watchLibrary\("global"\).features/);
});
test('each original and every HLS file matches immutable transport evidence',()=>{
 const hls=read('qa/week9-packaged-media.json');assert.equal(hls.length,18);
 for(const a of authority.assets){const b=fs.readFileSync(`public/reels/${a.videoId}.mp4`);assert.equal(b.length,a.sourceVideoBytes);assert.equal(hash(b),a.sourceVideoSha256);const pkg=hls.find(x=>x.videoId===a.videoId);assert.equal(pkg.sourceSha256,a.sourceVideoSha256);for(const f of pkg.files){const bytes=fs.readFileSync(f.path);assert.equal(bytes.length,f.bytes);assert.equal(hash(bytes),f.sha256);}}
});
test('restore rejects corrupted/unsafe chunks rather than publishing substituted originals',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'week9-restore-'));try{const transport=read('media-sources/week9-preview/manifest.json');fs.mkdirSync(path.join(root,'media-sources/week9-preview'),{recursive:true});transport.originals[0].parts[0].path='../bad';fs.writeFileSync(path.join(root,'media-sources/week9-preview/manifest.json'),JSON.stringify(transport));assert.throws(()=>restoreWeek9Previews(root),/Unsafe/);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
