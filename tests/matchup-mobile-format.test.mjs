import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatMatchupTimestamp} from '../lib/format-matchup-timestamp.mjs';
test('matchup source timestamps are readable and explicitly Eastern',()=>{
 assert.equal(formatMatchupTimestamp('2026-11-05T13:05:46+00:00'),'Nov 5, 2026, 8:05 AM EST');
 assert.equal(formatMatchupTimestamp('2026-07-05T13:05:46Z'),'Jul 5, 2026, 9:05 AM EDT');
 assert.equal(formatMatchupTimestamp(null),'Time unavailable');
 assert.equal(formatMatchupTimestamp('invalid'),'Time unavailable');
});
test('unpublished preview placeholders never claim published analysis or attribution',()=>{
 const s=readFileSync('app/matchups/[a]/[b]/page.js','utf8');
 assert.ok(s.includes("!final&&column&&' • Preview analysis was written before kickoff.'"));
 assert.ok(s.includes('{column&&<div className="matchupColumnByline">'));
 assert.ok(s.includes('formatMatchupTimestamp(currentDetails.updatedAt)'));
 const yahoo=readFileSync('app/components/editions/Matchup.js','utf8');
 assert.ok(yahoo.includes('{column&&<div className="matchupColumnByline">'));
});
