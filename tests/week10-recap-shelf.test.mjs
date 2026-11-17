import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {selectWeek10RecapCohort,selectWeek10RecapMatchup} from '../lib/week10-recap-cohort.mjs';
const clone=x=>structuredClone(x);
const source='a37c2dc6-3e8f-438c-8d92-2fca2dcf3647';
const waiver='week10-2026-recap-owner-playback-waiver-20261117';
// Existing fixture is transformed only for schema tests, never used for publication.
const adapt=x=>JSON.parse(JSON.stringify(x).replaceAll('week8','week10'));
const authority=adapt(JSON.parse(fs.readFileSync('qa/week8-recap-owner-playback-waiver.json')));
authority.exceptionId=waiver;authority.sourceMessageId=source;
const rows=adapt(JSON.parse(fs.readFileSync('data/week8-recap-approved-homepage-media.json'))).map(r=>({...r,week:10,playbackExceptionId:waiver,playbackWaiverSourceMessageId:source}));
test('Week10 cohort requires exact all18 authority binding and returns6perleague',()=>{
 for(const e of ['loog','doge','sunday-crew']) assert.equal(selectWeek10RecapCohort(rows,e,authority).length,6);
 for(const mutate of [r=>r.writer='wrong',r=>r.teamIds.reverse(),r=>r.teamIds=[1,1],r=>r.scriptSha256='x',r=>r.sourceSha256='x',r=>r.voiceId='x',r=>r.avatarId='x',r=>r.publicationApproved=false,r=>r.technicalQaPassed=false,r=>r.fullPlaybackInspection=true]){
  const input=clone(rows);mutate(input[0]);
  // Reversing presentation order is the same approved unordered matchup, not a leak.
  if(input[0].teamIds.join()===rows[0].teamIds.toReversed().join()&&input[0].writer===rows[0].writer){assert.equal(selectWeek10RecapCohort(input,'loog',authority).length,6);continue;}
  assert.deepEqual(selectWeek10RecapCohort(input,'loog',authority),[]);
 }
 assert.deepEqual(selectWeek10RecapCohort(rows.slice(1),'loog',authority),[]);
 const other=clone(authority);other.sourceMessageId='other';assert.deepEqual(selectWeek10RecapCohort(rows,'loog',other),[]);
});
test('Week10 matchup selection cannot leak another league, week, or pair',()=>{
 for(const r of rows){assert.deepEqual(selectWeek10RecapMatchup(rows,r.edition,10,...r.teamIds),[r]);assert.deepEqual(selectWeek10RecapMatchup(rows,r.edition,10,...r.teamIds.toReversed()),[r]);assert.deepEqual(selectWeek10RecapMatchup(rows,r.edition,9,...r.teamIds),[]);}
 assert.deepEqual(selectWeek10RecapMatchup(rows,'loog',10,1,1),[]);
});
test('archival shelves retained and approved written recap bytes unchanged',()=>{
 const archive=fs.readFileSync('lib/watch-library.js','utf8');for(const s of ['week10RecapRows(edition)','week10PreviewRows(edition)','week9PreviewRows(edition)','week8RecapRows(edition)','week8PreviewRows(edition)'])assert.ok(archive.includes(s));
 assert.equal(createHash('sha256').update(fs.readFileSync('data/matchup-recaps.json')).digest('hex'),'ac0ce5687f3965faa68945892b41283acae895b8b670e08d0ed916164176ef29');
});
