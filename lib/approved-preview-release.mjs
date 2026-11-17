// Static imports keep all approved evidence in the Next server bundle. Do not
// replace these with dynamic filesystem paths that may escape output tracing.
import definition from '../data/active-preview-release.json' with {type:'json'};
import week9Manifest from '../data/week9-approved-homepage-media.json' with {type:'json'};
import week9Authority from '../qa/week9-owner-playback-waiver.json' with {type:'json'};
import week10Manifest from '../data/week10-approved-homepage-media.json' with {type:'json'};
import week10Authority from '../qa/week10-publication-authority.json' with {type:'json'};
import {selectWeek9PreviewCohort} from './week9-preview-cohort.mjs';
import {selectWeek10PreviewCohort} from './week10-preview-cohort.mjs';

// Policies bind exact existing approvals. A new week needs an explicit reviewed
// policy; it must never inherit Week 10's owner-approved review limitations.
const policies = {
 'week9-owner-waiver-2026': {week:9, manifest:'data/week9-approved-homepage-media.json', authority:'qa/week9-owner-playback-waiver.json', select:selectWeek9PreviewCohort},
 'week10-owner-approved-2026': {week:10, manifest:'data/week10-approved-homepage-media.json', authority:'qa/week10-publication-authority.json', select:selectWeek10PreviewCohort},
};
export function validateReleaseHistory(currentWeek,historicalWeeks,approvedWeeks) {
 const unique=new Set([currentWeek,...historicalWeeks]);
 if(unique.size!==historicalWeeks.length+1 || historicalWeeks.some(week=>week>=currentWeek) ||
    approvedWeeks.filter(week=>week<currentWeek).some(week=>!historicalWeeks.includes(week)))throw Error('RELEASE_HISTORY_INVALID');
}
export function approvedPreviewRelease(definition, read) {
 const need=(ok,code)=>{if(!ok)throw Error(code);};
 need(definition?.version===1 && Array.isArray(definition.historical),'RELEASE_DEFINITION_INVALID');
 const resolve=entry=>{
  need(entry && Object.keys(entry).length===1 && typeof entry.policy==='string' && Object.hasOwn(policies,entry.policy),'RELEASE_POLICY_UNSUPPORTED');
  const policy=policies[entry.policy];
  const manifest=read(policy.manifest), authority=read(policy.authority);
  const rows=['loog','doge','sunday-crew'].flatMap(edition=>policy.select(manifest,edition,authority));
  need(rows.length===18,'RELEASE_COHORT_INVALID');
  return {week:policy.week,rows};
 };
 const current=resolve(definition.current), historical=definition.historical.map(resolve);
 // Every registered prior approved cohort is mandatory, including Week10 when
 // a later policy is explicitly introduced. Editing the descriptor cannot drop it.
 validateReleaseHistory(current.week,historical.map(c=>c.week),Object.values(policies).map(p=>p.week));
 return {...current,historical};
}
const evidence={
 'data/week9-approved-homepage-media.json':week9Manifest,
 'qa/week9-owner-playback-waiver.json':week9Authority,
 'data/week10-approved-homepage-media.json':week10Manifest,
 'qa/week10-publication-authority.json':week10Authority,
};
export function loadApprovedPreviewRelease() {
 return approvedPreviewRelease(definition,p=>evidence[p]);
}
