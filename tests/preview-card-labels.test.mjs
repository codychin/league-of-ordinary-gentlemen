import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {previewCardLabel} from '../scripts/operations/preview-card-labels.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const previous=read('data/week8-approved-homepage-media.json');
const current=read('data/week9-approved-homepage-media.json');
test('all established edition/team aliases reproduce the prior preview labels',()=>{
 for(const row of previous){assert.equal(previewCardLabel(row.edition,row.teamIds),row.short);assert.equal(previewCardLabel(row.edition,[...row.teamIds].reverse()),row.short.split(' · ').reverse().join(' · '));}
});
test('all 18 current preview labels use those aliases with full matchup metadata retained',()=>{
 assert.equal(current.length,18);
 for(const edition of ['loog','doge','sunday-crew'])assert.equal(current.filter(r=>r.edition===edition).length,6);
 for(const row of current){assert.equal(row.short,previewCardLabel(row.edition,row.teamIds));assert.match(row.matchup,/ vs\. /);assert.notEqual(row.short,row.matchup.replace(' vs. ',' · '));}
 assert.equal(current.find(r=>r.matchupKey==='loog-2026-week9-preview-1-7').short,'ROY · HOPKINS');
});
test('unknown team identity fails instead of falling back to full-name card labels',()=>{
 assert.throws(()=>previewCardLabel('unknown',[1,2]),/Unknown/);
 assert.throws(()=>previewCardLabel('loog',[1,99]),/Unknown/);
 assert.throws(()=>previewCardLabel('loog',[1]),/Exact/);
});
