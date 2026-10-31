#!/usr/bin/env node
// Assemble an immutable candidate overlay for the existing static shelf consumer.
// Never writes the source repository, public registry, branch or production.
import fs from 'node:fs';
import {playbackAttestation,assertWeek8ApprovedBinding} from './week8-playback-waiver.mjs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {assetIdentity} from './release-preflight.mjs';
import {leagueGate, preparationBinding, packageIdentities, saveOnce} from './prepare-media.mjs';
import {validatePackage, planPackages} from './package-missing-hls.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const need=(ok,message)=>{if(!ok)throw Error(message);};
export function assemble({repository,root,receipts,evidence,current,manifestPath='data/week7-approved-homepage-media.json',consumerPath='lib/week7-reels.js'},now=Date.now()) {
  need(path.resolve(repository)!==path.resolve(root),'Candidate must be isolated from source checkout');
  need(/^data\/week\d+-approved-homepage-media\.json$/.test(manifestPath),'Existing approved shelf manifest required');
  need(/^lib\/[a-z0-9-]+\.js$/.test(consumerPath),'Existing shelf consumer required');
  const assertCurrent=()=>{
    const c=current(),at=Date.parse(c.observedAt);
    need(at<=now && now-at<=300000,'Fresh main/registry read required');
    need(/^[a-f0-9]{40}$/.test(evidence.expectedMain) && c.currentMain===evidence.expectedMain,'Main superseded; do not assemble stale release');
    need(evidence.currentBindings.every(key=>c.currentBindings.includes(key)),'Registry superseded');
    return c;
  };
  assertCurrent();leagueGate(evidence,now);
  const bootstrap=evidence.bootstrap;
  const sourceManifest=path.join(repository,manifestPath);
  if(bootstrap) {
    need(manifestPath==='data/week8-approved-homepage-media.json' && !fs.existsSync(sourceManifest) && evidence.baseManifestSha256===null,'Bootstrap requires absent new Week 8 manifest, never an empty approved baseline');
    evidence.expected.forEach(assertWeek8ApprovedBinding);
  }
  const consumer=fs.readFileSync(path.join(bootstrap?root:repository,consumerPath),'utf8');
  if(bootstrap)need(assetIdentity(Buffer.from(consumer)).sha256===bootstrap.consumerSha256,'Bootstrap consumer changed');
  need(consumer.includes(`'../${manifestPath}'`) || consumer.includes(`"../${manifestPath}"`),'Manifest is not wired to the existing consumer');
  const baseBytes=bootstrap?null:fs.readFileSync(sourceManifest);
  if(!bootstrap)need(assetIdentity(baseBytes).sha256===evidence.baseManifestSha256,'Base shelf changed; re-read before assembly');
  const base=bootstrap?[]:JSON.parse(baseBytes),batch=evidence.expected,edition=batch[0].edition;
  const replaced=bootstrap?bootstrap.placements:base.filter(x=>x.edition===edition);
  need(Array.isArray(replaced) && new Set(replaced.map(x=>x.matchupKey)).size===6,'Exact six placement records required');
  if(bootstrap)need(replaced.every(x=>x.edition===edition && batch.some(b=>b.matchupKey===x.matchupKey) && ['short','matchup','left','right'].every(k=>typeof x[k]==='string' && x[k].length>0)),'Bootstrap placements must match exact cohort');
  need(replaced.length===6,'Existing six-item shelf placement required');
  const paths=[];
  const nextLeague=replaced.map(old=>{
    if(old.edition!==edition)return old;
    const b=batch.find(x=>x.matchupKey===old.matchupKey);
    need(b && b.season===old.season && b.week===old.week && b.kind===old.kind,'Do not change week/kind/chronology through media assembly');
    const key=preparationBinding(b),s=evidence.prepared.find(x=>x.preparationBinding===key);
    const dir=path.join(receipts,key),saved=read(path.join(dir,'shelf.json'));
    need(preparationBinding(saved)===preparationBinding(s),'Prepared shelf checkpoint mismatch');
    need(b.writer && b.voiceId,'Exact writer and voice provenance required');
    const original=`public/reels/${b.videoId}.mp4`,pkg=`public/reels-hls/${b.videoId}`;
    need(preparationBinding(assetIdentity(fs.readFileSync(path.join(root,original))))===preparationBinding(b.identity),'Original changed after preparation');
    validatePackage(path.join(root,pkg));
    const packageFiles=packageIdentities(path.join(root,pkg));
    const checkpoint=read(path.join(dir,'package.json')),qa=read(path.join(dir,'technical.json'));
    need(checkpoint.binding===key && preparationBinding(packageFiles)===preparationBinding(checkpoint.files) && qa.binding===key && qa.packageHash===preparationBinding(packageFiles) && qa.checks.originalAndHlsDecode===true,'Package/technical checkpoint changed');
    for(const name of ['poster.jpg','index.m3u8','init.mp4','seg_000.m4s'])need(packageFiles.some(f=>f.name===name),'Shelf HEAD/native HLS prerequisite missing');
    paths.push(original,...packageFiles.map(f=>`${pkg}/${f.name}`));
    // Preserve display ordering/labels. Whitelist fields; never carry a prior playback exception.
    return {edition:b.edition,teamIds:b.pair,season:b.season,week:b.week,kind:b.kind,
      short:old.short,matchup:old.matchup,left:old.left,right:old.right,id:b.videoId,writer:b.writer,
      matchupKey:b.matchupKey,scriptRegistryId:b.registryId,scriptSha256:b.scriptSha256,
      sourceRevision:b.scriptRevision,sourcePackageSha256:b.sourceRevision,sourceSha256:b.identity.sha256,
      sourceVideoSha256:b.identity.sha256,voiceId:b.voiceId,
      approvalSource:evidence.approval.evidence,publicationApproved:true,
      ...playbackAttestation(b,evidence.reviews?.find(r=>r.binding===key),evidence.ownerPlaybackWaiver),
      durationSeconds:qa.checks.durationSeconds};
  });
  const lineage={expectedMain:evidence.expectedMain,manifestPath,consumerPath,baseManifestSha256:evidence.baseManifestSha256,...(bootstrap?{bootstrapConsumerSha256:bootstrap.consumerSha256}: {})};
  saveOnce(path.join(receipts,'assembly-base.json'),lineage);
  const fileRecord=p=>({path:p,...assetIdentity(fs.readFileSync(path.join(root,p)))});
  const cohort={edition,rows:nextLeague,bindings:batch.map(preparationBinding),approvalExpiresAt:evidence.approval.expiresAt,files:paths.map(fileRecord)};
  // One immutable record per league in this candidate. A superseding revision needs
  // a new candidate root; it cannot silently replace an approved cohort.
  saveOnce(path.join(receipts,`cohort-${edition}.json`),cohort);
  const loadCohorts=()=>fs.readdirSync(receipts).filter(n=>/^cohort-(loog|doge|sunday-crew)\.json$/.test(n)).sort().map(n=>read(path.join(receipts,n)));
  const cohorts=loadCohorts(),allBindings=cohorts.flatMap(c=>c.bindings);
  const currentAll=assertCurrent();
  for(const c of cohorts) {
    need(c.bindings.every(key=>currentAll.currentBindings.includes(key)),'Earlier cohort revision superseded; reconcile whole candidate');
    need(Date.parse(c.approvalExpiresAt)>now,'Earlier cohort approval expired');
    for(const f of c.files)need(preparationBinding(fileRecord(f.path))===preparationBinding(f),'Earlier cohort bytes changed');
  }
  const next=bootstrap?cohorts.flatMap(c=>c.rows):base.map(old=>cohorts.find(c=>c.edition===old.edition)?.rows.find(r=>r.matchupKey===old.matchupKey)||old);
  const allPaths=cohorts.flatMap(c=>c.files.map(f=>f.path));
  need(planPackages(root,allPaths,[]).length===0,'Prepared batch must not trigger another HLS commit');
  const destination=path.join(root,manifestPath),before=fs.existsSync(destination)?fs.readFileSync(destination):null;
  if(before) {
    // Recover a crash after recording a cohort but before assembling its manifest.
    // Every existing row must be either the base or its recorded approved cohort.
    const prior=JSON.parse(before);
    const recognized=bootstrap
      ? prior.length>0 && prior.length%6===0 && prior.every(row=>next.some(n=>preparationBinding(n)===preparationBinding(row))) && [...new Set(prior.map(r=>r.edition))].every(e=>prior.filter(r=>r.edition===e).length===6)
      : prior.length===base.length && prior.every((row,i)=>preparationBinding(row)===preparationBinding(base[i]) || preparationBinding(row)===preparationBinding(next[i]));
    need(recognized,'Unrecognized candidate manifest; do not overwrite');
  }
  const bytes=Buffer.from(JSON.stringify(next,null,2)+'\n');
  if(!before || !before.equals(bytes)) {
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    const tmp=`${destination}.${randomUUID()}.tmp`,fd=fs.openSync(tmp,'wx');
    try {fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
    try {
      const c=assertCurrent();need(allBindings.every(key=>c.currentBindings.includes(key)),'Earlier cohort revision superseded');
      const actual=fs.existsSync(destination)?fs.readFileSync(destination):null;
      need((!actual&&!before)||(actual&&before&&actual.equals(before)), 'Concurrent candidate changed; reconcile before retry');
      fs.renameSync(tmp,destination);
      const dir=fs.openSync(path.dirname(destination),'r');try {fs.fsyncSync(dir);} finally {fs.closeSync(dir);}
    } finally {fs.rmSync(tmp,{force:true});}
  }
  // No distributed lock: a concurrent cohort must be reconciled, never reported
  // as a complete overlay. Transport must recheck these exact returned file hashes.
  need(preparationBinding(loadCohorts())===preparationBinding(cohorts),'Concurrent cohorts advanced; reconcile candidate');
  need(fs.readFileSync(destination).equals(bytes),'Concurrent manifest changed; reconcile candidate');
  const transportFiles=[manifestPath,...(bootstrap?[consumerPath]:[]),...allPaths].map(fileRecord);
  const result={status:'candidate-overlay-only',...lineage,transportFiles,
    bindings:allBindings,productionVerified:false};
  saveOnce(path.join(receipts,`assembly-${preparationBinding(result)}.json`),result);
  return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [file,currentFile]=process.argv.slice(2),args=read(file);
    console.log(JSON.stringify(assemble({...args,current:()=>read(currentFile)}),null,2));
  } catch(e) {console.error(e.message);process.exitCode=1;}
}
