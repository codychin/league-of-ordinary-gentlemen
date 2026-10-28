#!/usr/bin/env node
// Assemble an immutable candidate overlay for the existing static shelf consumer.
// Never writes the source repository, public registry, branch or production.
import fs from 'node:fs';
import path from 'node:path';
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
    need(preparationBinding([...c.currentBindings].sort())===preparationBinding([...evidence.currentBindings].sort()),'Registry superseded');
  };
  assertCurrent();leagueGate(evidence,now);
  const consumer=fs.readFileSync(path.join(repository,consumerPath),'utf8');
  need(consumer.includes(`'../${manifestPath}'`) || consumer.includes(`"../${manifestPath}"`),'Manifest is not wired to the existing consumer');
  const baseBytes=fs.readFileSync(path.join(repository,manifestPath));
  need(assetIdentity(baseBytes).sha256===evidence.baseManifestSha256,'Base shelf changed; re-read before assembly');
  const base=JSON.parse(baseBytes),batch=evidence.expected,edition=batch[0].edition;
  const replaced=base.filter(x=>x.edition===edition);
  need(replaced.length===6,'Existing six-item shelf placement required');
  const paths=[];
  const next=base.map(old=>{
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
      sourceVideoSha256:b.identity.sha256,voiceId:b.voiceId,qaStatus:'media_qa_passed',
      approvalSource:evidence.approval.evidence,publicationApproved:true,
      fullPlaybackInspection:true,independentAuditoryListening:true,performanceApproval:true,
      durationSeconds:qa.checks.durationSeconds};
  });
  need(planPackages(root,paths,[]).length===0,'Prepared batch must not trigger another HLS commit');
  assertCurrent();saveOnce(path.join(root,manifestPath),next);
  const transportFiles=[manifestPath,...paths].map(p=>({path:p,...assetIdentity(fs.readFileSync(path.join(root,p)))}));
  const result={status:'candidate-overlay-only',expectedMain:evidence.expectedMain,manifestPath,consumerPath,transportFiles,
    bindings:batch.map(preparationBinding),productionVerified:false};
  saveOnce(path.join(receipts,`assembly-${preparationBinding(result)}.json`),result);
  return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [file,currentFile]=process.argv.slice(2),args=read(file);
    console.log(JSON.stringify(assemble({...args,current:()=>read(currentFile)}),null,2));
  } catch(e) {console.error(e.message);process.exitCode=1;}
}
