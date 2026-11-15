import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {selectWeek10PreviewCohort,selectWeek10Matchup} from '../lib/week10-preview-cohort.mjs';
import {previewCardLabel} from '../scripts/operations/preview-card-labels.mjs';
const rows=JSON.parse(fs.readFileSync('data/week10-approved-homepage-media.json'));const authority=JSON.parse(fs.readFileSync('qa/week10-publication-authority.json'));
test('exact approved 18 retain scripts, voices, originals and concise aliases with honest review state',()=>{
 for(const edition of ['loog','doge','sunday-crew'])assert.equal(selectWeek10PreviewCohort(rows,edition,authority).length,6);
 for(const r of rows){assert.equal(createHash('sha256').update(r.script).digest('hex'),r.scriptSha256);assert.equal(r.short,previewCardLabel(r.edition,r.teamIds));const b=fs.readFileSync(`public/reels/${r.id}.mp4`);assert.equal(b.length,r.sourceBytes);assert.equal(createHash('sha256').update(b).digest('hex'),r.sourceSha256);assert.equal(r.independentAuditoryListening,false);assert.equal(r.fullPlaybackInspection,false);}
});
test('partial or changed source and false review claims fail closed',()=>{
 for(const mutate of [r=>r.pop(),r=>r[0].week=9,r=>r[0].voiceId='other',r=>r[0].sourceSha256='other',r=>r[0].publicationApproved=false,r=>r[0].fullPlaybackInspection=true]){const copy=structuredClone(rows);mutate(copy);assert.deepEqual(selectWeek10PreviewCohort(copy,'doge',authority),[]);}
});
test('every exact pair works in both orientations without cross-edition or historical leakage',()=>{
 for(const r of rows){const [a,b]=r.teamIds;assert.deepEqual(selectWeek10Matchup(rows,r.edition,10,a,b),[r]);assert.deepEqual(selectWeek10Matchup(rows,r.edition,10,b,a),[r]);assert.deepEqual(selectWeek10Matchup(rows,r.edition,9,a,b),[]);assert.deepEqual(selectWeek10Matchup(rows,r.edition,10,a,a),[]);}
});
test('Week 10 publication stays on league homepages and preserves matchup pages',()=>{
 for(const file of ['app/components/editions/Matchup.js','app/matchups/[a]/[b]/page.js'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/week10MatchupReels|<ReelsShelf/);
 for(const file of ['app/page.js','app/components/editions/Home.js']){
  const source=fs.readFileSync(file,'utf8');assert.match(source,/currentPreviewRelease/);assert.match(source,/week:previewWeek,reels:approvedReels/);assert.ok(source.includes('week${previewWeek}-preview-viewed-v1'));
 }
 const watch=fs.readFileSync('lib/watch-library.js','utf8');for(const entry of ['week10PreviewRows(edition)','week9PreviewRows(edition)','week8RecapRows(edition)','week8PreviewRows(edition)'])assert.ok(watch.includes(entry));
});

test('LOOG portraits resolve canonical team IDs rather than display names',()=>{const source=fs.readFileSync('app/page.js','utf8');assert.ok(source.includes('String(t.teamId)===String(r.teamIds[0])'));assert.ok(source.includes('String(t.teamId)===String(r.teamIds[1])'));});
