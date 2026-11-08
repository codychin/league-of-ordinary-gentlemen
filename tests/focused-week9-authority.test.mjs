import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateFocusedWeek9Authority,HEADER_SOURCE_SHA,HEADER_FILES} from '../scripts/operations/focused-week9-authority.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const fixture=()=>({config:read('qa/focused-week9-release.json'),sha:HEADER_SOURCE_SHA,main:HEADER_SOURCE_SHA,headerBlobMap:{...HEADER_FILES},rows:read('data/week9-approved-homepage-media.json'),authority:read('qa/week9-owner-playback-waiver.json')});
test('focused authority is exact current main, preserved header and eighteen bound originals',()=>{assert.equal(validateFocusedWeek9Authority(fixture()),true);});
test('focused release fails closed on authorization, stale candidate or header changes',()=>{
 for(const change of [x=>x.config.authorized=false,x=>x.config.releaseId='other',x=>x.config.authorization='publish anything',x=>x.sha='a'.repeat(40),x=>x.main='b'.repeat(40),x=>x.sha='19f48f2',x=>x.config.headerSourceSha='a'.repeat(40),x=>delete x.headerBlobMap['app/globals.css'],x=>x.headerBlobMap['app/globals.css']='f'.repeat(40),x=>{x.headerBlobMap['app/globals.css']='f'.repeat(40);x.config.headerFiles['app/globals.css']='f'.repeat(40);},x=>x.headerBlobMap['extra']='a'.repeat(40)]){const input=fixture();change(input);assert.throws(()=>validateFocusedWeek9Authority(input));}
});
test('focused authorization cannot waive new hosted playback or conceal the failed run',()=>{
 for(const change of [x=>x.config.freshHostedPlaybackRequired=false,x=>x.config.hostedPlaybackWaived=true,x=>delete x.config.knownFailure,x=>x.config.knownFailure.status='passed',x=>x.config.priorFullEvidence='other',x=>x.config.latestDiagnostic='other']){const input=fixture();change(input);assert.throws(()=>validateFocusedWeek9Authority(input));}
});
test('missing, stale, substituted or coordinated replacement media fails exact approval',()=>{
 for(const change of [x=>x.rows.pop(),x=>x.rows[0].id='f'.repeat(32),x=>x.rows[0].voiceId='changed',x=>x.rows[0].scriptSha256='f'.repeat(64),x=>x.rows[0].sourceVideoSha256='e'.repeat(64),x=>x.config.assetBindingSha256='0'.repeat(64),x=>{const r=x.rows[0],a=x.authority.assets.find(a=>a.videoId===r.id);r.voiceId='changed';a.voiceId='changed';}]){const input=fixture();change(input);assert.throws(()=>validateFocusedWeek9Authority(input));}
});
