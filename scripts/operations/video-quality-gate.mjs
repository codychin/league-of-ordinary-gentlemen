#!/usr/bin/env node
// Side-effect-free quality gate: NEVER calls a paid renderer or publishes media.
// VIDEO_CANDIDATE points to JSON containing candidate id, script, correspondent,
// league, video_url, qa and approved_reference. Default is policy validation only.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync('data/video-quality-rules.json','utf8'));
export function assess(candidate,rules=registry){
 const errors=[];
 if(!candidate||typeof candidate!=='object')return {pass:false,errors:['Missing candidate']};
 for(const key of ['id','script','correspondent','league','approved_reference'])if(typeof candidate[key]!=='string'||!candidate[key].trim())errors.push('Missing '+key);
 if(!['gannon','crane','sorrell','kells','march','pike'].includes(candidate.correspondent))errors.push('Unknown correspondent');
 if(!['loog','sunday-crew','doge'].includes(candidate.league))errors.push('Unknown league');
 if(typeof candidate.script==='string'){
  for(const name of ['Tetairoa McMillan','Mohsin']){
   if(new RegExp('\\b'+name+'\\b','i').test(candidate.script))errors.push('Script includes unnormalized spoken name: '+name);
  }
  if(/\\b(?:K-O-O|I-Z-A-Y|mo-ee-sin|emillysin)\\b/i.test(candidate.script))errors.push('Known broken phonetic token');
 }
 if(!candidate.qa||candidate.qa.audio_verified!==true||candidate.qa.visual_verified!==true||candidate.qa.facts_verified!==true||candidate.qa.mobile_crop_verified!==true)errors.push('Missing required human/visual QA signoffs');
 if(!candidate.qa?.pronunciation_verified)errors.push('Pronunciation unverified');
 if(candidate.qa?.critical_errors>0)errors.push('Critical errors present');
 if(candidate.publish_intent==='automatic' && !rules.autonomy.auto_publish_enabled)errors.push('Autopublishing disabled by policy');
 return {pass:errors.length===0,errors};
}
export function graduationStatus(clips,rules=registry){
 const policy=rules.autonomy;
 if(!policy.auto_publish_enabled)return {eligible:false,reason:'Autopublishing disabled by policy'};
 const batches=[...new Set(clips.map(c=>c.batch))].sort();
 const last=batches.slice(-policy.minimum_batches);
 if(last.length<policy.minimum_batches)return {eligible:false,reason:'Insufficient batches'};
 for(const batch of last){
  const group=clips.filter(c=>c.batch===batch);
  if(group.length<policy.minimum_clips_per_batch||group.filter(c=>c.first_pass_approved).length/group.length<policy.minimum_first_pass_rate||group.some(c=>c.critical_errors>0))return {eligible:false,reason:'Quality threshold failed for '+batch};
 }
 return {eligible:true,reason:'Quality threshold passed (publication still requires per-format authorization)'};
}
if(process.argv[1]?.endsWith('video-quality-gate.mjs')){
 const path=process.env.VIDEO_CANDIDATE;
 if(!path){assert.equal(registry.schema_version,1);assert.equal(registry.autonomy.auto_publish_enabled,false);console.log('PASS video policy schema; automatic publication disabled');}
 else {const outcome=assess(JSON.parse(readFileSync(path,'utf8')));console.log(JSON.stringify(outcome));if(!outcome.pass)process.exitCode=1;}
}
