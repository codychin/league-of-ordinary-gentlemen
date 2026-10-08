import test from 'node:test';
import assert from 'node:assert/strict';
import {checkApprovedVideoPackage,checkApprovedVideoPackageFiles} from '../lib/reel-publication-gate.mjs';
const a=[{id:'id1',title:'DOGE — Marnie — Sample',approval:'Approved by Cody'}];
const v=[{videoId:'id1',title:'DOGE — Marnie — Sample',videoUrl:'https://example.com/sample.mp4'}];
test('approved reel package data matches the release manifest',()=>assert.equal(checkApprovedVideoPackageFiles().ok,true));
test('fails closed on changed or missing editorial approvals',()=>{
 assert.equal(checkApprovedVideoPackage(v,a).ok,true);
 assert.equal(checkApprovedVideoPackage([{...v[0],videoId:'other'}],a).ok,false);
 assert.equal(checkApprovedVideoPackage(v,[{...a[0],title:'LOOG — Wrong'}]).ok,false);
 assert.equal(checkApprovedVideoPackage(v,[{...a[0],approval:''}]).ok,false);
});
test('fails closed on unknown edition, insecure URLs and duplicate IDs',()=>{
 assert.equal(checkApprovedVideoPackage([{...v[0],title:'Other — Story',videoUrl:'http://example.com',videoId:'new'},...v],a).ok,false);
});
