#!/usr/bin/env node
// No provider writes, generation, registry writes, publication, or promotion.
import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {assetIdentity, checkPreflight, resumeDecision, recordReceipt} from './release-preflight.mjs';
import {generateMissing, validatePackage} from './package-missing-hls.mjs';

const canonicalJson = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const sameJson = (a, b) => canonicalJson(a) === canonicalJson(b);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const need = (ok, message) => { if (!ok) throw Error(message); };
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const fresh = (at, now) => Number.isFinite(Date.parse(at)) && Date.parse(at) <= now && now - Date.parse(at) <= 300000;
const hex = /^[a-f0-9]{64}$/;
function syncDir(dir) { const fd = fs.openSync(dir, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } }
// Immutable checkpoints: atomic create-if-absent, never replace another writer's evidence.
export function saveOnce(file, value) {
  if(fs.existsSync(file)) {need(sameJson(read(file),value),`Conflicting checkpoint: ${file}`);return;}
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const tmp = `${file}.${randomUUID()}.tmp`;
  const fd = fs.openSync(tmp, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2)+'\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  try {
    try { fs.linkSync(tmp,file); } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      need(sameJson(read(file), value), `Conflicting checkpoint: ${file}`);
    }
    syncDir(path.dirname(file));
  } finally { fs.unlinkSync(tmp); }
}
export function binding(row, identity) {
  const m = row.metadata;
  need(row.id && m, 'Registry row required');
  need(['loog','sunday-crew','doge'].includes(m.edition) && ['preview','recap'].includes(m.kind), 'Invalid edition/kind');
  const pair = m.matchupTeamIds?.map(String).sort((a,b)=>Number(a)-Number(b));
  need(pair?.length===2 && pair[0]!==pair[1] && pair.every(x=>/^[1-9]\d*$/.test(x)), 'Exact unordered pair required');
  need(Number.isInteger(m.season) && Number.isInteger(m.week) && m.week>0, 'Season/week required');
  need(m.matchupKey===`${m.edition}-${m.season}-week${m.week}-${m.kind}-${pair.join('-')}`, 'Matchup key mismatch');
  need(m.scriptRevision && hex.test(m.scriptSha256) && hex.test(m.sourcePackageSha256), 'Source and exact script revisions required');
  need(m.scriptApproved===true && m.approvalStatus==='exact_script_approved', 'Exact script approval missing');
  need(m.videoGeneration?.status==='completed' && /^[a-f0-9]{32}$/.test(m.videoGeneration.videoId), 'Exact completed generation required; never rerender');
  need(!m.videoGenerationId || m.videoGenerationId===m.videoGeneration.videoId, 'Generation IDs disagree');
  need(identity && Number.isSafeInteger(identity.bytes) && identity.bytes>0 && hex.test(identity.sha256) && /^[a-f0-9]{40}$/.test(identity.gitBlobSha), 'Original identity required');
  return {registryId:row.id, edition:m.edition,season:m.season,week:m.week,kind:m.kind,pair,
    matchupKey:m.matchupKey,writer:row.writer_slug||m.writer||null,voiceId:m.voiceId||m.videoGeneration.voiceId||null,
    avatarId:m.videoGeneration.avatarId||null,sourceAudioSha256:m.videoGeneration.sourceAudioSha256||null,sourceRevision:m.sourcePackageSha256,scriptRevision:m.scriptRevision,
    scriptSha256:m.scriptSha256,videoId:m.videoGeneration.videoId,identity};
}
export function batchPreflight(evidence, now=Date.now()) {
  const errors=checkPreflight(evidence,now);
  for(const capability of ['auditory','fullMotion']) {
    const r=evidence.reviewCapability?.[capability];
    if(!r || r.status!=='demonstrated' || !r.reviewer || !r.evidence || !hex.test(r.canarySha256||'') || !fresh(r.observedAt,now))
      errors.push(`Review capability unavailable/unproven: ${capability}`);
  }
  for(const size of ['small','connectorExpandedOver16MiB']) {
    const r=evidence.ingestCanaries?.[size];
    if(!r || r.status!=='verified' || !r.durableCommit || !/^[a-f0-9]{40}$/.test(r.durableCommit) || !hex.test(r.sha256||'') || !r.readbackEvidence || !Number.isSafeInteger(r.bytes) || r.bytes<=0 || r.expandedBytes!==Math.ceil(r.bytes/3)*4 || (size==='connectorExpandedOver16MiB' ? r.expandedBytes<=16*1024*1024 : r.expandedBytes>16*1024*1024) || !fresh(r.observedAt,now))
      errors.push(`Durable ingest canary unproven: ${size}`);
  }
  return errors;
}
function identities(dir) {
  return fs.readdirSync(dir).sort().filter(n=>n!=='preparation-source.json').map(name=>{
    need(name===path.basename(name) && fs.lstatSync(path.join(dir,name)).isFile(),'Package must contain regular files');
    return {name,...assetIdentity(fs.readFileSync(path.join(dir,name)))};
  });
}
function equalIdentity(file, expected) {
  need(fs.lstatSync(file).isFile(), 'Original must be a regular file');
  need(digest(assetIdentity(fs.readFileSync(file)))===digest(expected),'Original hash/size mismatch');
}
// Existing authorized file/Git transport is the normal path. Connector envelopes/chunks
// are explicit recovery input, not hundreds of new blob writes or a network workaround.
function ingest(source, destination, expected) {
  if(fs.existsSync(destination)) { equalIdentity(destination,expected); return; }
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  const tmp=`${destination}.${randomUUID()}.partial`;
  try {
    if(source.kind==='file') fs.copyFileSync(source.path,tmp,fs.constants.COPYFILE_EXCL);
    else if(source.kind==='git') {
      need(/^[a-f0-9]{40}$/.test(source.commit),'Immutable transport commit required');
      need(/^public\/reels\/[a-f0-9]{32}\.mp4$/.test(source.path),'Exact original Git path required');
      const fd=fs.openSync(tmp,'wx');
      try {
        const result=spawnSync('git',['-C',source.repository,'show',`${source.commit}:${source.path}`],{stdio:['ignore',fd,'pipe']});
        need(result.status===0,`Git ingest failed: ${result.stderr?.toString()}`);
      } finally {fs.closeSync(fd);}
    } else if(source.kind==='connector-recovery') {
      const envelope=read(source.path);
      need(envelope.encoding==='base64' && typeof envelope.content==='string','Base64 connector envelope required');
      const encoded=envelope.content.replace(/\s/g,'');
      need(encoded.length%4===0 && !/[^A-Za-z0-9+/=]/.test(encoded) && Buffer.from(encoded,'base64').toString('base64')===encoded,'Invalid base64');
      fs.writeFileSync(tmp,Buffer.from(encoded,'base64'),{flag:'wx'});
    } else if(source.kind==='chunk-recovery') {
      need(source.chunks?.length>0,'Ordered chunks required');
      const fd=fs.openSync(tmp,'wx');
      try { for(const chunk of source.chunks) {equalIdentity(chunk.path,chunk.identity);fs.writeFileSync(fd,fs.readFileSync(chunk.path));} }
      finally {fs.closeSync(fd);}
    } else throw Error('Unsupported ingest route; access/executor blocked, do not bypass');
    equalIdentity(tmp,expected);
    const fd=fs.openSync(tmp,'r');try {fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
    try {fs.linkSync(tmp,destination);} catch(e) {if(e.code!=='EEXIST') throw e;equalIdentity(destination,expected);}
    syncDir(path.dirname(destination));
  } finally {fs.rmSync(tmp,{force:true});}
}
function technical(original, playlist) {
  const run=(cmd,args)=>{
    const r=spawnSync(cmd,args,{encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
    need(r.status===0,`${cmd} failed/interrupted: ${r.error?.message||r.stderr}`);return r.stdout;
  };
  const probe=JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',original]));
  const video=probe.streams.find(s=>s.codec_type==='video');
  need(video?.width>0 && video?.height>0 && probe.streams.some(s=>s.codec_type==='audio') && Number(probe.format.duration)>0,'Nonempty audio/video required');
  for(const file of [original,playlist]) run('ffmpeg',['-v','error','-xerror','-i',file,'-map','0:v:0','-map','0:a:0','-f','null','-']);
  return {durationSeconds:Number(probe.format.duration),width:video.width,height:video.height,originalAndHlsDecode:true,
    fullAuditoryReviewPerformed:false,fullMotionReviewPerformed:false,performanceApproval:false};
}

// current() must re-read the existing registry export/checkpoint before every stage.
// This is optimistic revision checking, not a DB lock or a replacement for release-time re-read.
export function prepare({request,current,root,receipts,afterStage=()=>{},runTechnical=technical,packageMedia=generateMissing,throughStage='shelf',now=()=>Date.now()}) {
  need(['ingest','package','technical','shelf'].includes(throughStage),'Unknown preparation stage boundary');
  let b;
  try {b=binding(request.row,request.identity);} catch(e) {
    saveOnce(path.join(receipts,`blocked-${randomUUID()}.json`),{registryId:request.row?.id,videoId:request.row?.metadata?.videoGeneration?.videoId,stage:'render',status:'blocked',reason:e.message,at:new Date(now()).toISOString()});throw e;
  }
  const key=digest(b);
  const dir=path.join(receipts,key), original=path.join(root,'public/reels',`${b.videoId}.mp4`);
  const packaged=path.join(root,'public/reels-hls',b.videoId);
  let stage='authorization';
  const guard=()=>{
    const c=current();need(fresh(c.observedAt,now()),'Registry snapshot stale; re-read source revision');
    need(digest(binding(c.row,request.identity))===key,'Source revision superseded; stop stale/concurrent preparation');
    const a=request.preparationApproval;
    need(a?.status==='approved' && a.binding===key && a.evidence && Date.parse(a.expiresAt)>now(),'Preparation approval pending/denied/expired or wrong revision');
  };
  const event=(status,reason)=>saveOnce(path.join(dir,`event-${randomUUID()}.json`),{binding:key,videoId:b.videoId,stage,status,reason,at:new Date(now()).toISOString()});
  const boundary=name=>({status:`prepared-through-${name}`,completedStage:name,binding:key,checkpointDirectory:dir,checkpoint:read(path.join(dir,`${name}.json`))});
  const checkpoint=(name,value)=>{
    guard();saveOnce(path.join(dir,`${name}.json`),value);afterStage(name);
  };
  try {
    guard(); saveOnce(path.join(dir,'binding.json'),b);
    // Claim immutable video identity without a lock; a different revision must use a different candidate root.
    saveOnce(path.join(receipts,`video-${b.videoId}.json`),{binding:key});
    stage='ingest';if(!fs.existsSync(path.join(dir,'ingest.json')))event('incomplete','Reconciling exact original before any copy');
    ingest(request.source,original,b.identity);checkpoint('ingest',{binding:key,identity:b.identity,scope:'local-original-only'});
    if(throughStage==='ingest')return boundary('ingest');
    stage='package';if(!fs.existsSync(path.join(dir,'package.json')))event('incomplete','Reconciling immutable package before ffmpeg');
    if(!fs.existsSync(packaged)) {
      const work=fs.mkdtempSync(path.join(root,'.prepare-'));
      try {
        fs.mkdirSync(path.join(work,'public/reels'),{recursive:true});
        fs.linkSync(original,path.join(work,'public/reels',`${b.videoId}.mp4`));
        if(request.existingPackage) {
          const p=request.existingPackage;
          need(p.videoId===b.videoId && p.sourceSha256===b.identity.sha256 && Array.isArray(p.files) && p.files.length>0,'Package provenance required');
          const dest=path.join(work,'public/reels-hls',b.videoId);fs.mkdirSync(dest,{recursive:true});
          for(const f of p.files) {need(f.name===path.basename(f.name)&&f.name!=='preparation-source.json','Invalid package path');ingest({kind:'file',path:path.join(p.path,f.name)},path.join(dest,f.name),f.identity);}
        } else packageMedia(work,[b.videoId]);
        const ready=path.join(work,'public/reels-hls',b.videoId);validatePackage(ready);
        for(const name of fs.readdirSync(ready)) {const fd=fs.openSync(path.join(ready,name),'r');try {fs.fsyncSync(fd);} finally {fs.closeSync(fd);}}
        saveOnce(path.join(ready,'preparation-source.json'),{binding:key,source:b.identity,files:identities(ready)});
        guard();fs.mkdirSync(path.dirname(packaged),{recursive:true});
        try {fs.renameSync(ready,packaged);} catch(e) {if(!['EEXIST','ENOTEMPTY'].includes(e.code))throw e;}
        syncDir(path.dirname(packaged));
      } finally {fs.rmSync(work,{recursive:true,force:true});}
    }
    validatePackage(packaged);
    const provenance=read(path.join(packaged,'preparation-source.json'));
    need(provenance.binding===key && digest(provenance.files)===digest(identities(packaged)),'Package provenance/hash mismatch');
    checkpoint('package',{binding:key,files:provenance.files});
    if(throughStage==='package')return boundary('package');
    stage='technical';
    const technicalFile=path.join(dir,'technical.json');
    if(!fs.existsSync(technicalFile)) {event('incomplete','Independent original and HLS decode pending');checkpoint('technical',{binding:key,packageHash:digest(provenance.files),checks:runTechnical(original,path.join(packaged,'index.m3u8'))});}
    const qa=read(technicalFile);
    need(qa.binding===key && qa.packageHash===digest(provenance.files) && qa.checks.originalAndHlsDecode===true,'Technical checkpoint mismatch');
    guard();if(throughStage==='technical')return boundary('technical');
    stage='shelf';
    const shelf={id:b.videoId,edition:b.edition,season:b.season,week:b.week,kind:b.kind,teamIds:b.pair,matchupKey:b.matchupKey,
      writer:b.writer,voiceId:b.voiceId,scriptRegistryId:b.registryId,scriptSha256:b.scriptSha256,sourceRevision:b.scriptRevision,sourcePackageSha256:b.sourceRevision,
      sourceSha256:b.identity.sha256,preparationBinding:key,qaStatus:'technical_only_review_required',publicationApproved:false};
    checkpoint('shelf',shelf);
    return {status:'prepared-review-required',completedStage:'shelf',binding:key,checkpointDirectory:dir,checkpoint:shelf,shelf};
  } catch(e) {event(stage==='authorization' || /approval|superseded|stale|Unsupported/.test(e.message)?'blocked':'failed',e.message);throw e;}
}

export function leagueGate({expected,prepared,reviews,approval,currentBindings},now=Date.now()) {
  need(expected.length===6 && prepared.length===6,'Complete six-per-league required');
  need(new Set(expected.map(x=>x.matchupKey)).size===6,'Six distinct matchups required');
  const scope=x=>`${x.edition}/${x.season}/${x.week}/${x.kind}`;
  need(new Set(expected.map(scope)).size===1,'League/preview/recap isolation required');
  need(new Set(expected.flatMap(x=>x.pair)).size===12,'Exact twelve-team pairing set required');
  const keys=expected.map(digest).sort();
  need(new Set(keys).size===6 && digest([...currentBindings].sort())===digest(keys),'Re-read current registry bindings before release');
  need(digest(prepared.map(x=>x.preparationBinding).sort())===digest(keys),'Incomplete or stale prepared batch');
  for(const b of expected) {
    const s=prepared.find(x=>x.preparationBinding===digest(b));
    need(s.id===b.videoId && s.matchupKey===b.matchupKey && scope(s)===scope(b) && s.sourceSha256===b.identity.sha256 && s.scriptSha256===b.scriptSha256,'Shelf binding mismatch');
    const r=reviews.find(x=>x.binding===digest(b));
    need(r?.status==='passed' && r.fullAuditoryReviewPerformed===true && r.fullMotionReviewPerformed===true && r.performanceApproval===true && r.reviewer && r.evidence,'Full auditory/motion review required; Week 7 exception is not reusable');
  }
  need(approval?.status==='approved' && approval.evidence && Date.parse(approval.expiresAt)>now && digest([...approval.bindings].sort())===digest(keys),'Exact unexpired publication approval required');
  return {status:'eligible-for-existing-staging-gates',bindings:keys,productionVerified:false};
}
export function deliveryDecision(input,now=Date.now()) {
  // Reconcile uncertain uploads first; expired authority never permits another write.
  const approval=input.approval?.status==='approved' && Date.parse(input.approval.expiresAt)>now && input.approval.evidence && input.approval.sha256===input.identity?.sha256 ? 'approved':'pending';
  return resumeDecision({...input,approval},now);
}
export function recordDeliveryReconciliation(directory,input,now=Date.now()) {
  const decision=deliveryDecision(input,now);
  const status=decision==='already-present'?'confirmed':decision==='read-remote-first'?'uncertain':decision==='eligible-for-authorized-upload'?'not-executed':'blocked';
  saveOnce(path.join(directory,`delivery-${randomUUID()}.json`),{releaseId:input.releaseId,repository:input.repository,targetRef:input.targetRef,path:input.path,identity:input.identity,stage:'transport',status,decision,remote:input.remote||null,at:new Date(now).toISOString()});
  if(decision==='already-present')recordReceipt(directory,input,now);
  return {status,decision};
}
export function verifyDeliveryProof({sha,receipt,alias,routes,expectedRoutes,expectedDomain,expectedProjectId},now=Date.now()) {
  need(/^[a-f0-9]{40}$/.test(sha) && receipt?.sha===sha && receipt.state==='verified','Existing verified release receipt for exact SHA required');
  need(expectedDomain && expectedProjectId && receipt.projectId===expectedProjectId && alias?.projectId===expectedProjectId && alias?.domain===expectedDomain,'Exact requested domain/project required');
  need(alias?.sha===sha && alias.readyState==='READY' && alias.deploymentId===receipt.candidateId && fresh(alias.observedAt,now),'Fresh exact live domain identity required');
  need(expectedRoutes?.length===6 && new Set(expectedRoutes).size===6,'All six matchup routes required');
  for(const route of expectedRoutes) {
    const r=routes.find(x=>x.path===route);
    need(r?.sha===sha && r.status===200 && r.mediaBytesMatched===true && r.playbackReviewed===true && r.evidence && fresh(r.observedAt,now),'Exact live route/media proof incomplete');
  }
  return {status:'production_verified',sha};
}
export {digest as preparationBinding, identities as packageIdentities};
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [command,file,currentFile,root,receipts]=process.argv.slice(2);
    if(command==='preflight') {const errors=batchPreflight(read(file));console.log(JSON.stringify({ok:!errors.length,errors},null,2));if(errors.length)process.exitCode=1;}
    else if(command==='prepare') {
      const extra=process.argv.slice(7);
      need(extra.length===0 || (extra.length===2 && extra[0]==='--through-stage'),'Expected --through-stage ingest|package|technical|shelf');
      console.log(JSON.stringify(prepare({request:read(file),current:()=>read(currentFile),root:path.resolve(root),receipts:path.resolve(receipts),throughStage:extra[1]||'shelf'}),null,2));
    }
    else if(command==='resume-delivery') {const result=recordDeliveryReconciliation(currentFile,read(file));console.log(JSON.stringify(result,null,2));if(!['already-present','eligible-for-authorized-upload'].includes(result.decision))process.exitCode=1;}
    else if(command==='league-gate') console.log(JSON.stringify(leagueGate(read(file)),null,2));
    else throw Error('Usage: prepare-media.mjs preflight SNAPSHOT | prepare REQUEST CURRENT_REGISTRY_EXPORT CANDIDATE_ROOT RECEIPTS | league-gate EVIDENCE | resume-delivery EVIDENCE RECEIPTS');
  } catch(e) {console.error(e.message);process.exitCode=1;}
}
