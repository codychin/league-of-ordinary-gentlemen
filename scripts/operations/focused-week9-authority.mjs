import {createHash} from 'node:crypto';
import {selectWeek9PreviewCohort} from '../../lib/week9-preview-cohort.mjs';
const SHA=/^[a-f0-9]{40}$/;const HASH=/^[a-f0-9]{64}$/;
export const RELEASE_ID='week9-preview-20261108';
export const HEADER_SOURCE_SHA='930490b417ef70776e028e716d6d4e8f84a619e7';
export const HEADER_FILES=Object.freeze({"app/components/PwaShell.jsx":"b4b456a4113e8573ac0d5796d7c7498bc4ad9370","app/components/ReelsShelf.jsx":"731e346c55928de2730d117c957db1716af74845","app/components/useCompactMobileNav.js":"56253852e825ec797a790e1e0e8e3b4a58a07285","app/layout.js":"498d99e5e3e153d1696f9b5ad76cc7e4c682e43f","app/pwa.css":"e4a004b445b923f7fff7f6beeeb483a7d1fe8e04","lib/scroll-to-section.mjs":"10f0c01e070b888bd36b6384500026bfbd20208c","app/globals.css":"fd8be2c8b758abdf71b5c0460d640682a3f7b3c5"});
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
 need(expected&&typeof expected==='object'&&!Array.isArray(expected)&&Object.keys(expected).length===Object.keys(HEADER_FILES).length,'EXACT_RESTORED_SHELL_FILES_REQUIRED');
 need(headerBlobMap&&typeof headerBlobMap==='object'&&!Array.isArray(headerBlobMap)&&Object.keys(headerBlobMap).length===Object.keys(HEADER_FILES).length,'EXACT_CURRENT_HEADER_BLOBS_REQUIRED');
 for(const [file,blob] of Object.entries(expected)){
  need(Object.hasOwn(HEADER_FILES,file)&&HEADER_FILES[file]===blob,'APPROVED_HEADER_BINDING_CHANGED');
  need(/^(app|lib|qa)\/[A-Za-z0-9_./-]+$/.test(file)&&!file.split('/').includes('..')&&SHA.test(blob),'INVALID_HEADER_BINDING');
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
