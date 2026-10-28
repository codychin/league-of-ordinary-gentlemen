#!/usr/bin/env node
// No-spend isolated replay. No review, generation, approval, upload or release claims.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {performance} from 'node:perf_hooks';
import {fixture} from '../../qa/fixtures/media-preparation.mjs';
import {prepare} from './prepare-media.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'brief-preparation-benchmark-'));
const manifest=JSON.parse(fs.readFileSync('qa/week7-recap-assets.json'));
const results=[];
try {
  for(const asset of manifest.bindings) {
    const request=fixture(asset.videoId), candidate=path.join(root,asset.videoId);
    request.preparationApproval.expiresAt=new Date(Date.now()+3600000).toISOString();
    const options={request,root:candidate,receipts:path.join(candidate,'receipts'),current:()=>({observedAt:new Date().toISOString(),row:request.row})};
    const start=performance.now();
    const result=prepare(options);
    const prepared=performance.now();
    prepare({...options,packageMedia:()=>{throw Error('Duplicate packaging');},runTechnical:()=>{throw Error('Duplicate decode');}});
    const end=performance.now();
    results.push({videoId:asset.videoId,bytes:asset.sourceBytes,prepareMs:Math.round(prepared-start),resumeMs:Math.round(end-prepared),status:result.status});
    console.error(`Prepared and resumed ${results.length}/18: ${asset.videoId}`);
  }
  // One real canonical ffmpeg packaging run in isolation, then a no-op restart.
  const request=fixture(manifest.bindings[0].videoId);delete request.existingPackage;
  request.preparationApproval.expiresAt=new Date(Date.now()+3600000).toISOString();
  const candidate=path.join(root,'canonical-ffmpeg');
  const options={request,root:candidate,receipts:path.join(candidate,'receipts'),current:()=>({observedAt:new Date().toISOString(),row:request.row})};
  const start=performance.now();prepare(options);const packaged=performance.now();
  prepare({...options,packageMedia:()=>{throw Error('Duplicate ffmpeg');},runTechnical:()=>{throw Error('Duplicate decode');}});
  console.log(JSON.stringify({mode:'isolated-existing-artifact-replay',recordedAt:new Date().toISOString(),results,
    totalPreparationMs:results.reduce((s,r)=>s+r.prepareMs,0),totalResumeMs:results.reduce((s,r)=>s+r.resumeMs,0),
    canonicalPackagingAndDecodeMs:Math.round(packaged-start),canonicalResumeMs:Math.round(performance.now()-packaged),
    publicationPerformed:false,reviewPerformed:false,normalExternalIngestProven:false,approvalToLiveMeasured:false},null,2));
} finally {fs.rmSync(root,{recursive:true,force:true});}
