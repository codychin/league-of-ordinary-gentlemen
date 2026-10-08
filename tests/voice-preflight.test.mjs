import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPronunciations,findCanonMentions,validateVoicePreflight} from '../lib/voice-preflight.mjs';
const canon = loadPronunciations();
const job = {speaker:'marnie',script:'Mohsin saw Romeo Doubs in the tunnel. Nipun called.',scope:'league',leagueId:'doge',scriptVersion:'v1',voiceProfileVersion:'marnie-v1',glossaryVersion:'global-v1',scriptApproved:true,audioApproved:true,budgetCredits:100,fullRenderAttempts:0,properNames:['Mohsin','Nipun','Romeo Doubs']};
test('reads approved global canon and detects names without altering copy',()=> {
 const script=job.script; const mentions=findCanonMentions(script,canon);
 assert.deepEqual(mentions.map(x=>x.term),['Mohsin','Romeo Doubs','Nipun']);
 assert.equal(job.script,script);
 assert.equal(mentions[0].spoken,'MOE-sin');
});
test('preflight requires approval provenance and scope',()=> {
 assert.equal(validateVoicePreflight(job,canon).ok,true);
 assert.match(validateVoicePreflight({...job,audioApproved:false},canon).errors.join(' '),/Audio preview/);
 assert.match(validateVoicePreflight({...job,scope:'league',leagueId:''},canon).errors.join(' '),/League ID/);
 assert.match(validateVoicePreflight({...job,properNames:['Some Unreviewed Name']},canon).errors.join(' '),/Unverified name/);
});
test('repeat full renders require special approval',()=> {
 assert.match(validateVoicePreflight({...job,fullRenderAttempts:2},canon).errors.join(' '),/Further full render/);
});
test('term boundaries avoid accidental partial names',()=> {
 assert.equal(findCanonMentions('A different Malika and Nipunishment',canon).length,0);
});
