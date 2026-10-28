import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {fixture} from '../fixtures/media-preparation.mjs';
import {prepare,binding,preparationBinding,verifyDeliveryProof} from '../../scripts/operations/prepare-media.mjs';
import {assemble} from '../../scripts/operations/assemble-prepared-media.mjs';
import {assetIdentity} from '../../scripts/operations/release-preflight.mjs';
import {planPackages,generateMissing} from '../../scripts/operations/package-missing-hls.mjs';
const main='ecbc1cadf0ed09aa2c147b649419c25b05ff24ba';
const base=JSON.parse(fs.readFileSync('data/week7-approved-homepage-media.json'));
test('operator CLI → prepared six → actual consumer manifest → shelf HEAD/MP4/HLS → exact serving receipt',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'brief-integration-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const receipts=path.join(root,'receipts'),prepared=[],expected=[];
  const now=Date.now(),at=new Date(now).toISOString();
  for(const row of base.filter(x=>x.edition==='doge')) {
    const request=fixture(row.id);request.preparationApproval.expiresAt=new Date(now+3600000).toISOString();
    const req=path.join(root,'request.json'),current=path.join(root,'current.json');
    fs.writeFileSync(req,JSON.stringify(request));fs.writeFileSync(current,JSON.stringify({observedAt:at,row:request.row}));
    // Real entry point, real original + HLS decodes, no test pass callbacks.
    const result=spawnSync(process.execPath,['scripts/operations/prepare-media.mjs','prepare',req,current,root,receipts],{encoding:'utf8',timeout:180000});
    assert.equal(result.status,0,result.stderr);prepared.push(JSON.parse(result.stdout).shelf);expected.push(binding(request.row,request.identity));
  }
  const keys=expected.map(preparationBinding),evidence={expected,prepared,currentBindings:keys,expectedMain:main,
    baseManifestSha256:assetIdentity(fs.readFileSync('data/week7-approved-homepage-media.json')).sha256,
    reviews:keys.map(binding=>({binding,status:'passed',fullAuditoryReviewPerformed:true,fullMotionReviewPerformed:true,performanceApproval:true,reviewer:'synthetic integration fixture only',evidence:'TEST-ONLY'})),
    approval:{status:'approved',bindings:keys,evidence:'TEST-ONLY',expiresAt:new Date(now+3600000).toISOString()}};
  const options={repository:process.cwd(),root,receipts,evidence,current:()=>({observedAt:at,currentMain:main,currentBindings:keys})};
  assert.throws(()=>assemble({...options,evidence:{...evidence,prepared:prepared.slice(1)}},now),/six/);
  assert.throws(()=>assemble({...options,current:()=>({observedAt:at,currentMain:'b'.repeat(40),currentBindings:keys})},now),/superseded/);
  assert.throws(()=>assemble({...options,evidence:{...evidence,reviews:keys.map(binding=>({binding,status:'technical_pass_owner_playback_exception'}))}},now),/review/);
  const overlay=assemble(options,now),manifestPath=path.join(root,overlay.manifestPath),next=JSON.parse(fs.readFileSync(manifestPath));
  assert.deepEqual(next.filter(x=>x.edition!=='doge'),base.filter(x=>x.edition!=='doge'));
  assert.deepEqual(next.map(x=>[x.matchupKey,x.short,x.matchup,x.left,x.right]),base.map(x=>[x.matchupKey,x.short,x.matchup,x.left,x.right]));
  assert.ok(!overlay.transportFiles.some(x=>x.path.includes('preparation-source')));
  assert.deepEqual(planPackages(root,overlay.transportFiles.map(f=>f.path),[]),[]);
  // Load actual consumer source with only the manifest import redirected to this candidate.
  let source=fs.readFileSync('lib/week7-reels.js','utf8');
  source=source.replace("import manifest from '../data/week7-approved-homepage-media.json';",`const manifest=${JSON.stringify(next)};`).replace("'../app/articles/writers'",JSON.stringify(pathToFileURL(path.resolve('app/articles/writers.js')).href));
  const {week7Reels}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const reels=week7Reels('doge');assert.equal(reels.length,6);assert.ok(reels.every(r=>r.correspondent && r.avatar && !r.playbackExceptionId));
  const component=fs.readFileSync('app/components/ReelsShelf.jsx','utf8');
  const expression=component.match(/const mediaSrc=r=>([^\n]+);/)[1];
  const mediaSrc=new Function('r','nativeHls',`return ${expression}`);
  const server=createServer((req,res)=>{const file=path.join(root,'public',new URL(req.url,'http://local').pathname);if(!fs.existsSync(file)){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Length':fs.statSync(file).size});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
  const origin=`http://127.0.0.1:${server.address().port}`;
  for(const r of reels) {
    for(const name of ['index.m3u8','poster.jpg','seg_000.m4s'])assert.equal((await fetch(`${origin}/reels-hls/${r.id}/${name}`,{method:'HEAD'})).status,200);
    for(const nativeHls of [true,false])assert.equal((await fetch(origin+mediaSrc(r,nativeHls),{method:'HEAD'})).status,200);
    const playlist=await(await fetch(origin+mediaSrc(r,true))).text();
    for(const f of [...playlist.matchAll(/URI="([^"]+)"/g)].map(x=>x[1]).concat(playlist.split('\n').filter(x=>x&&!x.startsWith('#'))))assert.equal((await fetch(`${origin}/reels-hls/${r.id}/${f}`,{method:'HEAD'})).status,200);
  }
  const expectedRoutes=reels.map(r=>`/doge/matchups/${r.teamIds.join('/')}`),proof={sha:main,expectedDomain:'fixture.example',expectedProjectId:'project',receipt:{sha:main,state:'verified',candidateId:'TEST-ONLY',projectId:'project'},alias:{sha:main,domain:'fixture.example',projectId:'project',deploymentId:'TEST-ONLY',readyState:'READY',observedAt:at},expectedRoutes,routes:expectedRoutes.map(path=>({path,sha:main,status:200,mediaBytesMatched:true,playbackReviewed:true,evidence:'SYNTHETIC-PROOF-NOT-LIVE',observedAt:at}))};
  assert.equal(verifyDeliveryProof(proof,now).status,'production_verified');
  assert.throws(()=>verifyDeliveryProof({...proof,receipt:{...proof.receipt,state:'alias-verified'}},now),/receipt/);
  assert.throws(()=>verifyDeliveryProof({...proof,sha:'b'.repeat(40)},now),/receipt/);
});

test('real ffmpeg interruption leaves no package and resumes exact original',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'brief-kill-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const request=fixture();request.preparationApproval.expiresAt=new Date(Date.now()+3600000).toISOString();
 const o={root,request,receipts:path.join(root,'receipts'),current:()=>({observedAt:new Date().toISOString(),row:request.row})},existing=request.existingPackage;delete request.existingPackage;
 const interrupted=(root,ids)=>generateMissing(root,ids,(command,args)=>{
  const result=spawnSync(command,args,{timeout:args.includes('libx264')?20:30000,stdio:'ignore'});
  if(result.status!==0)throw Error('ffmpeg interrupted by test timeout');
 });
 assert.throws(()=>prepare({...o,packageMedia:interrupted}),/ffmpeg interrupted/);
 const id=o.request.row.metadata.videoGeneration.videoId;
 assert.equal(fs.existsSync(path.join(o.root,'public/reels-hls',id)),false);
 o.request.existingPackage=existing;assert.equal(prepare(o).status,'prepared-review-required');
});
