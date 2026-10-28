#!/usr/bin/env node
// One ordinary Git push for an exact prepared artifact set. No provider downloads,
// generation, branch checkout, force push, publication, or production ref writes.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {assetIdentity,recordReceipt} from './release-preflight.mjs';
import {preparationBinding,saveOnce} from './prepare-media.mjs';
const need=(ok,message)=>{if(!ok)throw Error(message);};
export function transport({repository,root,receipts,repositoryFullName,targetRef,parent,expectedRemote,artifacts,approval,createdAt},now=Date.now()) {
  need(/^refs\/heads\/(?:feat|media-prepared)\/[a-zA-Z0-9/_-]+$/.test(targetRef),'Only an explicitly approved candidate ref; never main/staging');
  need(/^[a-f0-9]{40}$/.test(parent) && /^[a-f0-9]{40}$/.test(expectedRemote),'Exact parent and current remote SHA required');
  need(Date.parse(createdAt)<=now,'Stable commit timestamp required');
  const files=[...artifacts].sort((a,b)=>a.path.localeCompare(b.path));
  need(files.length>0 && new Set(files.map(f=>f.path)).size===files.length,'Distinct exact artifact paths required');
  for(const f of files)need(/^(?:public\/reels\/[a-f0-9]{32}\.mp4|public\/reels-hls\/[a-f0-9]{32}\/[a-zA-Z0-9_.-]+|data\/week\d+-approved-homepage-media\.json|qa\/media-preparation-[a-z0-9-]+\.json)$/.test(f.path) && !f.path.includes('..') && !f.path.endsWith('/preparation-source.json'),'Only reviewed public artifacts and sanitized preparation checkpoints');
  const artifactSet=preparationBinding(files),key=preparationBinding({repositoryFullName,targetRef,parent,expectedRemote,artifactSet,createdAt});
  const git=(args,options={})=>execFileSync('git',['-C',repository,...args],{encoding:'utf8',maxBuffer:64*1024*1024,...options});
  const authorized=()=>need(approval?.status==='approved' && approval.artifactSet===artifactSet && approval.targetRef===targetRef && approval.repository===repositoryFullName && approval.evidence && Date.parse(approval.expiresAt)>Date.now(),'Exact current transport approval required');
  const readRemote=()=>{
    const lines=git(['ls-remote','--heads','origin',targetRef]).trim().split('\n').filter(Boolean);
    need(lines.length===1,'Target ref absent/ambiguous; reconcile, do not create a different branch');
    const [sha,ref]=lines[0].split(/\s+/);need(ref===targetRef && /^[a-f0-9]{40}$/.test(sha),'Unknown remote result');return sha;
  };
  const dir=path.join(receipts,`transport-${key}`);fs.mkdirSync(dir,{recursive:true});
  const intentPath=path.join(dir,'intent.json'),attemptPath=path.join(dir,'attempt.json');
  const event=(status,reason)=>saveOnce(path.join(dir,`${status}-${preparationBinding(reason)}.json`),{stage:'transport',status,reason,artifactSet,targetRef});
  let commit;
  try {
    authorized();
    // Existing configured Git authentication only; never relocate/read credentials.
    const origin=git(['remote','get-url','origin']).trim();
    if(!origin.startsWith('/')) {const url=new URL(origin);need(url.protocol==='https:' && url.hostname==='github.com' && url.pathname.replace(/^\//,'').replace(/\.git$/,'')===repositoryFullName,'Unexpected existing Git destination');}
    git(['merge-base','--is-ancestor',expectedRemote,parent]);
    if(fs.existsSync(intentPath)) {
      const intent=JSON.parse(fs.readFileSync(intentPath));need(intent.artifactSet===artifactSet && intent.parent===parent,'Transport intent mismatch');commit=intent.commit;
    } else {
      const index=path.join(dir,'index');fs.rmSync(index,{force:true});
      const env={...process.env,GIT_INDEX_FILE:path.resolve(index)};
      try {
        git(['read-tree',parent],{env});
        let entries='';
        for(const f of files) {
          const source=path.join(root,f.path);need(fs.lstatSync(source).isFile(),'Artifact must be a regular file');
          const bytes=fs.readFileSync(source),identity=assetIdentity(bytes);
          need(identity.bytes===f.bytes && identity.sha256===f.sha256 && identity.gitBlobSha===f.gitBlobSha,'Artifact changed since assembly; reconcile before transport');
          const sha=git(['hash-object','-w','--stdin'],{input:bytes}).trim();need(sha===f.gitBlobSha,'Git blob identity mismatch');
          entries+=`100644 ${sha}\t${f.path}\n`;
        }
        git(['update-index','--index-info'],{env,input:entries});
        const tree=git(['write-tree'],{env}).trim();
        commit=git(['commit-tree',tree,'-p',parent,'-m',`Retain prepared media checkpoint ${artifactSet}`],{env:{...env,GIT_AUTHOR_DATE:createdAt,GIT_COMMITTER_DATE:createdAt}}).trim();
        saveOnce(intentPath,{artifactSet,parent,commit,targetRef,files});
      } finally {fs.rmSync(index,{force:true});}
    }
    const remote=readRemote();
    if(remote!==commit) {
      need(remote===expectedRemote,'Remote candidate changed; do not overwrite or rebase');
      need(!fs.existsSync(attemptPath),'Previous push outcome unresolved; remote-read reconciliation required, never retry blindly');
      authorized();saveOnce(attemptPath,{commit,targetRef,expectedRemote,at:new Date().toISOString()});
      try {git(['push','origin',`${commit}:${targetRef}`]);} catch(e) {event('uncertain','Push returned an error; read remote before any retry');}
      need(readRemote()===commit,'Push outcome uncertain or target advanced; no automatic retry');
    }
    // Fetch without switching branches. A blob alone is not a durable committed asset.
    git(['fetch','origin',commit]);
    for(const f of files) {
      const bytes=git(['show',`${commit}:${f.path}`],{encoding:null});
      const identity=assetIdentity(bytes);
      need(identity.bytes===f.bytes && identity.sha256===f.sha256 && identity.gitBlobSha===f.gitBlobSha,'Remote immutable commit artifact mismatch');
      recordReceipt(dir,{releaseId:key,repository:repositoryFullName,targetRef,path:f.path,identity,remote:{status:'found',sha:identity.gitBlobSha,observedAt:new Date().toISOString()}});
    }
    need(readRemote()===commit,'Remote advanced during verification; reconcile before release');
    const result={scope:'git-commit-only',status:'durably-retained',commit,parent,artifactSet,targetRef,fileCount:files.length,productionVerified:false};
    saveOnce(path.join(dir,'confirmed.json'),result);return result;
  } catch(e) {event(/uncertain|unresolved/.test(e.message)?'uncertain':'blocked',e.message);throw e;}
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  try {console.log(JSON.stringify(transport(JSON.parse(fs.readFileSync(process.argv[2]))),null,2));}
  catch(e) {console.error(e.message);process.exitCode=1;}
}
