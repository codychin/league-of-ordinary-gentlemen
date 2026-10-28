import {execFileSync} from 'node:child_process';
import {fixture} from '../qa/fixtures/media-preparation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assetIdentity} from '../scripts/operations/release-preflight.mjs';
import {prepare,binding,preparationBinding,leagueGate,batchPreflight,deliveryDecision,verifyDeliveryProof,recordDeliveryReconciliation} from '../scripts/operations/prepare-media.mjs';
const now=Date.parse('2026-10-28T02:00:00Z'),at=new Date(now).toISOString();
const manifest=JSON.parse(fs.readFileSync('qa/week7-recap-assets.json'));
const repo=process.cwd();

function setup(t,req=fixture()) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'brief-prep-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  return {request:req,root,receipts:path.join(root,'receipts'),current:()=>({observedAt:at,row:req.row}),now:()=>now,
    runTechnical:()=>({originalAndHlsDecode:true,fixtureOnly:true})};
}

test('restart after each stage reconciles immutable media; completed asset never repackages or repeats decode',t=>{
  for(const stage of ['ingest','package','technical','shelf']) {
    const opts=setup(t);let decodes=0;
    opts.runTechnical=()=>{decodes++;return {originalAndHlsDecode:true};};
    assert.throws(()=>prepare({...opts,afterStage:s=>{if(s===stage)throw Error('executor interrupted');}}),/interrupted/);
    const result=prepare({...opts,packageMedia:()=>{throw Error('must reuse immutable package');}});
    const before=fs.statSync(path.join(opts.root,'public/reels',`${result.shelf.id}.mp4`)).mtimeMs;
    prepare({...opts,runTechnical:()=>{throw Error('duplicate decode');}});
    assert.equal(decodes,1);assert.equal(result.shelf.publicationApproved,false);
    assert.equal(fs.statSync(path.join(opts.root,'public/reels',`${result.shelf.id}.mp4`)).mtimeMs,before);
  }
});
test('source and concurrent revision changes, stale exports and expired/pending approval stop',t=>{
  for(const state of ['stale','revision','expired','pending']) {
    const o=setup(t),row=structuredClone(o.request.row);
    if(state==='revision')row.metadata.sourcePackageSha256='f'.repeat(64);
    if(state==='expired')o.request.preparationApproval.expiresAt=at;
    if(state==='pending')o.request.preparationApproval.status='pending';
    o.current=()=>({observedAt:state==='stale'?'2026-10-27T00:00:00Z':at,row});
    assert.throws(()=>prepare(o),/stale|superseded|approval/);
    assert.equal(fs.existsSync(path.join(o.root,'public/reels')),false);
  }
  const o=setup(t);let row=o.request.row;
  o.current=()=>({observedAt:at,row});
  assert.throws(()=>prepare({...o,afterStage:s=>{if(s==='ingest'){row=structuredClone(row);row.metadata.scriptRevision='new';}}}),/superseded/);
  assert.equal(fs.existsSync(path.join(o.receipts,o.request.preparationApproval.binding,'shelf.json')),false);
});
test('partial or mismatched downloads never install original; unsupported route records block',t=>{
  for(const kind of ['partial','mismatch','unsupported']) {
    const o=setup(t);
    if(kind==='unsupported')o.request.source={kind:'denied-network'};
    else {const p=path.join(o.root,'partial');fs.writeFileSync(p,'partial bytes');o.request.source={kind:'file',path:p};}
    assert.throws(()=>prepare(o),/hash|Unsupported/);
    assert.equal(fs.existsSync(path.join(o.root,'public/reels',`${o.request.row.metadata.videoGeneration.videoId}.mp4`)),false);
    const events=fs.readdirSync(path.join(o.receipts,o.request.preparationApproval.binding)).filter(x=>x.startsWith('event-')).map(x=>JSON.parse(fs.readFileSync(path.join(o.receipts,o.request.preparationApproval.binding,x))));
    assert.ok(events.some(x=>['failed','blocked'].includes(x.status)));
  }
});
test('interrupted ffmpeg leaves original and failed package checkpoint, resume packages once',t=>{
  const o=setup(t);const pkg=o.request.existingPackage;delete o.request.existingPackage;
  assert.throws(()=>prepare({...o,packageMedia:()=>{throw Error('ffmpeg interrupted');}}),/ffmpeg interrupted/);
  assert.ok(fs.existsSync(path.join(o.root,'public/reels',`${o.request.row.metadata.videoGeneration.videoId}.mp4`)));
  o.request.existingPackage=pkg;prepare(o);
  const id=o.request.row.metadata.videoGeneration.videoId;
  fs.appendFileSync(path.join(o.root,'public/reels-hls',id,'poster.jpg'),'corruption');
  assert.throws(()=>prepare(o),/hash mismatch/);
});
test('real small and >16 MiB connector-expanded originals preserve exact bytes',t=>{
  const big=manifest.bindings.reduce((a,b)=>a.sourceBytes>b.sourceBytes?a:b);
  for(const id of [manifest.bindings[0].videoId,big.videoId]) {
    const o=setup(t,fixture(id));const bytes=fs.readFileSync(o.request.source.path);
    const envelope=path.join(o.root,'connector.json');const content=bytes.toString('base64');
    if(id===big.videoId)assert.ok(content.length>16*1024*1024);
    fs.writeFileSync(envelope,JSON.stringify({encoding:'base64',content}));o.request.source={kind:'connector-recovery',path:envelope};
    prepare(o);assert.deepEqual(assetIdentity(fs.readFileSync(path.join(o.root,'public/reels',`${id}.mp4`))),o.request.identity);
  }
});
test('immutable Git transport and ordered chunk recovery preserve original without changing branch',t=>{
  for(const kind of ['git','chunk-recovery']) {
    const o=setup(t);const id=o.request.row.metadata.videoGeneration.videoId;
    if(kind==='git') {
      const sourceRepo=path.join(o.root,'git-source'),sourcePath=`public/reels/${id}.mp4`;
      fs.mkdirSync(path.join(sourceRepo,'public/reels'),{recursive:true});fs.copyFileSync(o.request.source.path,path.join(sourceRepo,sourcePath));
      const git=args=>execFileSync('git',['-C',sourceRepo,...args],{encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
      git(['init']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);git(['add',sourcePath]);git(['commit','-m','immutable original fixture']);
      o.request.source={kind,repository:sourceRepo,commit:git(['rev-parse','HEAD']),path:sourcePath};
    }
    else {
      const bytes=fs.readFileSync(o.request.source.path),chunks=[];
      for(let i=0;i<bytes.length;i+=4*1024*1024){const part=bytes.subarray(i,i+4*1024*1024),p=path.join(o.root,`chunk${i}`);fs.writeFileSync(p,part);chunks.push({path:p,identity:assetIdentity(part)});}
      o.request.source={kind,chunks};
    }
    prepare(o);
  }
});
test('uncertain upload reconciles first; expired approval never permits retry; matching remote no-op',()=>{
  const identity=fixture().identity,approval={status:'approved',evidence:'fixture',sha256:identity.sha256,expiresAt:'2026-10-29T00:00:00Z'};
  assert.equal(deliveryDecision({identity,approval},now),'read-remote-first');
  assert.equal(deliveryDecision({identity,approval,remote:{status:'uncertain',observedAt:at}},now),'read-remote-first');
  assert.equal(deliveryDecision({identity,approval:{...approval,expiresAt:at},remote:{status:'not_found',observedAt:at}},now),'wait-for-authorization');
  assert.equal(deliveryDecision({identity,approval,remote:{status:'found',sha:identity.gitBlobSha,observedAt:at}},now),'already-present');
});
test('review preflight cannot pass from tool availability or historic exception',()=>{
  const e={version:1,observedAt:at,taskKind:'engineering-release',expectedMain:'a'.repeat(40),currentMain:'a'.repeat(40),workflowScanComplete:true,workflows:[],releasePath:{assetUpload:'verified',previewVerification:'verified',productionPromotion:'verified'}};
  assert.ok(batchPreflight(e,now).some(x=>x.includes('auditory')));
  assert.ok(batchPreflight(e,now).some(x=>x.includes('fullMotion')));
  assert.ok(batchPreflight({...e,reviewCapability:{auditory:true,fullMotion:true}},now).length);
});
test('complete six league release requires fresh revisions, actual reviews and separate exact approval',t=>{
  const reqs=manifest.bindings.filter(x=>x.edition==='doge').map(x=>fixture(x.videoId));
  const expected=reqs.map(r=>binding(r.row,r.identity));
  const prepared=reqs.map(r=>prepare(setup(t,r)).shelf);
  const bindings=expected.map(preparationBinding);
  const evidence={expected,prepared,currentBindings:bindings,reviews:bindings.map(binding=>({binding,status:'passed',fullAuditoryReviewPerformed:true,fullMotionReviewPerformed:true,performanceApproval:true,reviewer:'TEST ONLY',evidence:'TEST ONLY'})),approval:{bindings,status:'approved',evidence:'TEST ONLY',expiresAt:'2026-10-29T00:00:00Z'}};
  assert.equal(leagueGate(evidence,now).productionVerified,false);
  assert.throws(()=>leagueGate({...evidence,prepared:prepared.slice(1)},now),/six/);
  assert.throws(()=>leagueGate({...evidence,reviews:[]},now),/review/);
  assert.throws(()=>leagueGate({...evidence,currentBindings:['f'.repeat(64)]},now),/registry/);
  const cross=structuredClone(evidence);cross.expected[0].kind='preview';assert.throws(()=>leagueGate(cross,now),/isolation/);
  const expired=structuredClone(evidence);expired.approval.expiresAt=at;assert.throws(()=>leagueGate(expired,now),/approval/);
  const tamper=structuredClone(evidence);tamper.prepared[0].edition='loog';assert.throws(()=>leagueGate(tamper,now),/binding/);
});

test('rendered, READY, alias-only, wrong SHA and partial routes are not final live proof',()=>{
  const sha='a'.repeat(40),expectedRoutes=Array.from({length:6},(_,i)=>`/matchups/${i}`);
  const e={sha,expectedDomain:'fixture.example',expectedProjectId:'project',receipt:{sha,state:'verified',candidateId:'deployment',projectId:'project'},alias:{sha,domain:'fixture.example',projectId:'project',readyState:'READY',deploymentId:'deployment',observedAt:at},expectedRoutes,routes:expectedRoutes.map(path=>({path,sha,status:200,mediaBytesMatched:true,playbackReviewed:true,evidence:'TEST ONLY',observedAt:at}))};
  assert.equal(verifyDeliveryProof(e,now).status,'production_verified');
  for(const state of ['rendered','prepared','READY','alias-verified']) assert.throws(()=>verifyDeliveryProof({...e,receipt:{...e.receipt,state}},now),/receipt/);
  assert.throws(()=>verifyDeliveryProof({...e,alias:{...e.alias,sha:'b'.repeat(40)}},now),/identity/);
  assert.throws(()=>verifyDeliveryProof({...e,routes:e.routes.slice(1)},now),/incomplete/);
});

test('uncertain transport is persisted separately and never becomes a success receipt',t=>{
 const o=setup(t),input={releaseId:'test',repository:'codychin/league-of-ordinary-gentlemen',targetRef:'refs/heads/test',path:'public/reels/test.mp4',identity:o.request.identity,remote:{status:'uncertain',observedAt:at}};
 assert.equal(recordDeliveryReconciliation(o.receipts,input,now).status,'uncertain');
 const files=fs.readdirSync(o.receipts);assert.equal(files.length,1);
 const receipt=JSON.parse(fs.readFileSync(path.join(o.receipts,files[0])));
 assert.equal(receipt.status,'uncertain');assert.notEqual(receipt.scope,'git-blob-only');
 assert.equal(recordDeliveryReconciliation(o.receipts,{...input,remote:{status:'found',sha:input.identity.gitBlobSha,observedAt:at}},now).status,'confirmed');
 assert.ok(fs.readdirSync(o.receipts).some(f=>JSON.parse(fs.readFileSync(path.join(o.receipts,f))).scope==='git-blob-only'));
});

test('a competing revision cannot reuse the same generation ID checkpoints',t=>{
 const o=setup(t);prepare(o);
 const changed=structuredClone(o.request);changed.row.metadata.scriptRevision='superseding-revision';
 changed.preparationApproval.binding=preparationBinding(binding(changed.row,changed.identity));
 assert.throws(()=>prepare({...o,request:changed,current:()=>({observedAt:at,row:changed.row})}),/Conflicting checkpoint/);
});

test('three leagues assemble cumulatively, idempotently, preserving chronology and rejecting stale cohorts',async t=>{
 const {assemble}=await import('../scripts/operations/assemble-prepared-media.mjs');
 const o=setup(t),base=JSON.parse(fs.readFileSync('data/week7-approved-homepage-media.json'));
 const expected=[],prepared=[];
 for(const row of base) {
  const request=fixture(row.id);expected.push(binding(request.row,request.identity));
  prepared.push(prepare({...o,request,current:()=>({observedAt:at,row:request.row})}).shelf);
 }
 const all=expected.map(preparationBinding),main='a'.repeat(40);
 const baseSha=assetIdentity(fs.readFileSync('data/week7-approved-homepage-media.json')).sha256;
 const makeEvidence=edition=>{
  const batch=expected.filter(x=>x.edition===edition),keys=batch.map(preparationBinding);
  return {expected:batch,prepared:prepared.filter(x=>x.edition===edition),currentBindings:keys,expectedMain:main,baseManifestSha256:baseSha,
   reviews:keys.map(binding=>({binding,status:'passed',fullAuditoryReviewPerformed:true,fullMotionReviewPerformed:true,performanceApproval:true,reviewer:'TEST ONLY',evidence:'TEST ONLY'})),
   approval:{bindings:keys,status:'approved',evidence:'TEST-ONLY',expiresAt:'2026-10-29T00:00:00Z'}};
 };
 const opts={repository:repo,root:o.root,receipts:o.receipts,current:()=>({observedAt:at,currentMain:main,currentBindings:all})};
 const target=path.join(o.root,'data/week7-approved-homepage-media.json');
 let previous;
 for(const [index,edition] of ['doge','loog','sunday-crew'].entries()) {
  const result=assemble({...opts,evidence:makeEvidence(edition)},now),bytes=fs.readFileSync(target),next=JSON.parse(bytes);
  if(previous)assert.deepEqual(next.filter(x=>x.edition!==edition),previous.filter(x=>x.edition!==edition));
  assert.deepEqual(next.map(x=>[x.matchupKey,x.short,x.matchup,x.left,x.right]),base.map(x=>[x.matchupKey,x.short,x.matchup,x.left,x.right]));
  assert.equal(result.bindings.length,(index+1)*6);
  const again=assemble({...opts,evidence:makeEvidence(edition)},now);
  assert.deepEqual(result,again);assert.deepEqual(fs.readFileSync(target),bytes);previous=next;
 }
 assert.ok(previous.every(x=>x.qaStatus==='media_qa_passed'&&!x.playbackExceptionId));
 const changed=all.slice(1);
 assert.throws(()=>assemble({...opts,evidence:makeEvidence('sunday-crew'),current:()=>({observedAt:at,currentMain:main,currentBindings:changed})},now),/Earlier cohort revision superseded/);
 // A source revision moving between the initial and final registry reads must stop.
 let reads=0;
 assert.throws(()=>assemble({...opts,evidence:makeEvidence('sunday-crew'),current:()=>({observedAt:at,currentMain:main,currentBindings:++reads===1?all:changed})},now),/Earlier cohort revision superseded/);
});

test('ordinary batch Git transport durably retains exact artifacts and resumes without a second commit',async t=>{
 const {transport}=await import('../scripts/operations/transport-prepared-media.mjs');
 const o=setup(t),work=path.join(o.root,'repo'),remote=path.join(o.root,'remote.git');fs.mkdirSync(work);
 const git=(args,cwd=work)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
 git(['init','--bare',remote],o.root);git(['init',work],o.root);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
 fs.writeFileSync(path.join(work,'README'),'fixture');git(['add','README']);git(['commit','-m','base']);git(['remote','add','origin',remote]);git(['push','origin','HEAD:refs/heads/feat/test-preparation']);
 const parent=git(['rev-parse','HEAD']),file='qa/media-preparation-fixture.json';fs.mkdirSync(path.join(work,'qa'));fs.writeFileSync(path.join(work,file),'{}\n');
 const artifacts=[{path:file,...assetIdentity(fs.readFileSync(path.join(work,file)))}],targetRef='refs/heads/feat/test-preparation';
 const args={repository:work,root:work,receipts:o.receipts,repositoryFullName:'fixture/test',targetRef,parent,expectedRemote:parent,artifacts,createdAt:new Date().toISOString(),approval:{status:'approved',artifactSet:preparationBinding(artifacts),repository:'fixture/test',targetRef,evidence:'TEST ONLY',expiresAt:new Date(Date.now()+60000).toISOString()}};
 const first=transport(args);assert.equal(first.productionVerified,false);assert.equal(git(['rev-parse','HEAD']),parent,'No branch checkout/movement');
 assert.equal(git(['rev-parse',targetRef],remote),first.commit);assert.deepEqual(transport(args),first);
 fs.writeFileSync(path.join(work,file),'changed');
 const changed={...args,createdAt:new Date(Date.now()-1000).toISOString()};
 assert.throws(()=>transport({...changed,approval:{...args.approval,expiresAt:new Date(0).toISOString()}}),/approval/);
 assert.throws(()=>transport({...args,targetRef:'refs/heads/main'}),/never main/);
});
