import {createHash} from 'node:crypto';
import {selectWeek9PreviewCohort} from '../../lib/week9-preview-cohort.mjs';
const SHA=/^[a-f0-9]{40}$/;const HASH=/^[a-f0-9]{64}$/;
export const RELEASE_ID='week9-preview-20261108';
export const HEADER_SOURCE_SHA='19f48f2fa7fd86e113fab3c032be2cd7d88da18f';
export const HEADER_FILES=Object.freeze({'app/components/PwaShell.jsx':'c6f25c84d79093929d9065ab3eee9f6596846a04','app/globals.css':'fd8be2c8b758abdf71b5c0460d640682a3f7b3c5','app/standalone-shell.css':'1908e792b42a09818e1db452a22d5636258bdfa5'});
export const APPROVED_ASSET_BINDING_SHA256='035c87968d5b7d1d04d308d0968ea127eefb90997db528f1639b493059c23b5d';
const need=(ok,code)=>{if(!ok)throw Error(code);};
export function week9BindingHash(rows){
 need(Array.isArray(rows),'INVALID_WEEK9_ROWS');
 const bindings=rows.map(r=>({id:r.id,edition:r.edition,matchupKey:r.matchupKey,writer:r.writer,registryId:r.scriptRegistryId,scriptSha256:r.scriptSha256,scriptRevision:r.sourceRevision,sourcePackageSha256:r.sourcePackageSha256,sourceVideoSha256:r.sourceVideoSha256,voiceId:r.voiceId,avatarId:r.avatarId,durationSeconds:r.durationSeconds})).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 return createHash('sha256').update(JSON.stringify(bindings)).digest('hex');
}
export function validateFocusedWeek9Authority({config,sha,main,headerBlobMap,rows,authority}){
 need(config?.version===1&&config.releaseId===RELEASE_ID&&config.authorized===true,'FOCUSED_RELEASE_NOT_AUTHORIZED');
 need(config.authorization==='Owner-approved immediate release without duplicate full-suite execution.','AUTHORIZATION_SCOPE_MISMATCH');
 need(SHA.test(sha||'')&&SHA.test(main||'')&&sha===main,'CANDIDATE_NOT_CURRENT_MAIN');
 need(config.headerSourceSha===HEADER_SOURCE_SHA,'HEADER_SOURCE_MISMATCH');
 const expected=config.headerFiles;
 need(expected&&typeof expected==='object'&&!Array.isArray(expected)&&Object.keys(expected).length===3,'EXACT_THREE_HEADER_FILES_REQUIRED');
 need(headerBlobMap&&typeof headerBlobMap==='object'&&!Array.isArray(headerBlobMap)&&Object.keys(headerBlobMap).length===3,'EXACT_CURRENT_HEADER_BLOBS_REQUIRED');
 for(const [file,blob] of Object.entries(expected)){
  need(Object.hasOwn(HEADER_FILES,file)&&HEADER_FILES[file]===blob,'APPROVED_HEADER_BINDING_CHANGED');
  need(/^(app|qa)\/[A-Za-z0-9_./-]+$/.test(file)&&!file.split('/').includes('..')&&SHA.test(blob),'INVALID_HEADER_BINDING');
  need(Object.hasOwn(headerBlobMap,file)&&headerBlobMap[file]===blob,'CURRENT_MAIN_HEADER_CHANGED');
 }
 need(config.priorFullEvidence==='8f1c9800'&&config.latestDiagnostic==='0912e86','FOCUSED_EVIDENCE_CHANGED');
 need(config.knownFailure?.revision==='20d394d5'&&config.knownFailure.status==='unresolved-webkit-playback-stall','KNOWN_FAILURE_MUST_REMAIN_DISCLOSED');
 need(config.freshHostedPlaybackRequired===true&&config.hostedPlaybackWaived===false,'FRESH_HOSTED_PLAYBACK_MUST_NOT_BE_WAIVED');
 const accepted=['loog','doge','sunday-crew'].flatMap(e=>selectWeek9PreviewCohort(rows,e,authority));
 need(accepted.length===18,'EXACT_APPROVED_WEEK9_COHORT_REQUIRED');
 need(HASH.test(config.assetBindingSha256||'')&&config.assetBindingSha256===APPROVED_ASSET_BINDING_SHA256&&week9BindingHash(accepted)===config.assetBindingSha256,'APPROVED_ASSET_BINDINGS_CHANGED');
 // This validates authority only, never playback or production delivery.
 return true;
}
