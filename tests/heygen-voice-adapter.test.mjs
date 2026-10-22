import test from 'node:test';
import assert from 'node:assert/strict';
import {compareProviderGlossary,prepareHeyGenVideoRequest,MAIN_GLOSSARY_ID,loadVoiceProfiles} from '../lib/heygen-voice-adapter.mjs';
const base={speaker:'marnie',script:'Mohsin spoke with Nipun.',scope:'league',leagueId:'doge',scriptVersion:'script-1',voiceProfileVersion:'marnie-v1',glossaryVersion:'global-v1',glossarySynced:true,scriptApproved:true,audioApproved:true,budgetCredits:75,fullRenderAttempts:0,properNames:['Mohsin','Nipun'],avatarId:'verified-avatar',voiceId:'verified-voice'};
test('builds guarded HeyGen payload while preserving names and scoping',()=>{
 const r=prepareHeyGenVideoRequest(base); assert.equal(r.ok,true);assert.equal(r.request.brandGlossaryId,MAIN_GLOSSARY_ID);assert.equal(r.request.script,base.script);assert.equal(r.provenance.leagueId,'doge');
});
test('fails closed on unverified provider sync and missing voice IDs',()=>{
 assert.match(prepareHeyGenVideoRequest({...base,glossarySynced:false}).errors.join(' '),/glossary sync/);
 assert.match(prepareHeyGenVideoRequest({...base,avatarId:null,voiceId:null}).errors.join(' '),/avatar ID/);
 assert.match(prepareHeyGenVideoRequest({...base,voiceProfileVersion:'marnie-old'}).errors.join(' '),/version mismatch/);
});
test('detects live glossary mismatch without changing provider data',()=>{
 const terms=[{term:'Nipun',pronunciation:'nuh-POON'},{term:'Mohsin',pronunciation:'MOE-sin'}];
 const diff=compareProviderGlossary(terms);
 assert.ok(diff.some(x=>x.term==='Nipun'&&x.kind==='different'));
 assert.ok(!diff.some(x=>x.term==='Mohsin'&&x.kind==='different'));
});
test('every correspondent has a unique versioned baseline',()=>{
 const profiles=loadVoiceProfiles();assert.equal(profiles.length,6);assert.equal(new Set(profiles.map(x=>x.id)).size,6);assert.ok(profiles.every(x=>x.version&&x.style));
});
