import test from 'node:test';
import assert from 'node:assert/strict';
import {morningCandidates} from '../supabase/functions/brief-editorial-worker/morning.ts';
import {sundayDeskMeta} from '../app/live-desk/data.js';
const now=new Date('2026-10-18T13:30:00Z');
const candidate=(headline,description='')=>morningCandidates({as_of:now.toISOString(),morningNews:[{id:'fixture',headline,description,published:'2026-10-18T11:30:00Z',source_url:'https://www.espn.com/nfl/story/_/id/50200514/test'}],scoreboard:[]},now);
test('Shough broken-bones report cannot enter uncorroborated morning briefs',()=>{
 assert.equal(candidate("Sources: Saints' Shough playing with 2 broken bones in non-throwing hand","Saints quarterback Tyler Shough has been playing with two broken bones in his left hand, sources told ESPN.").length,0);
});
test('medical synonyms are excluded in headline or description',()=>{
 for(const claim of ['broken hand','broke his left wrist','two broken bones','ACL tear','torn meniscus','tearing his Achilles','fractured ribs','ankle sprain','strained hamstring','dislocated shoulder','ruptured tendon','surgery scheduled','hospitalized overnight','carted off','concussion protocol','knee swelling','shoulder soreness']){
  assert.equal(candidate(claim).length,0,claim);
  assert.equal(candidate('Sunday notebook',claim).length,0,claim+' description');
 }
});
test('nonmedical break and tear idioms remain eligible',()=>{
 for(const headline of ['A broken record for crowd noise','Fans shed tears of joy','A quarterback on a scoring tear','Breaking down the London rivalry','A new chapter for Wembley football']){
  assert.equal(candidate(headline).length,1,headline);
 }
});
test('pregame candidates remain eligible and stale news remains excluded',()=>{
 const result=morningCandidates({as_of:now.toISOString(),morningNews:[{id:'old',headline:'London notebook',published:'2026-10-17T11:30:00Z',source_url:'https://www.espn.com/nfl/story'}],scoreboard:[{id:'later',date:'2026-10-18T17:00:00Z',status:{type:{state:'pre'}},competitions:[]}]},now);
 assert.deepEqual(result.map(x=>x.event_key),['later:pregame']);
});
test('Live Desk footer makes no stale kickoff or recurring promise',()=>{
 assert.equal(sundayDeskMeta.standby,'LIVE DESK • REPORTS AS THEY DEVELOP');
});
