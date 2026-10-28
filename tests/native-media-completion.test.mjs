import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import readline from 'node:readline';
import {fixture} from '../qa/fixtures/media-preparation.mjs';
import {nativeStageCallbacks} from '../scripts/operations/native-media-stage.mjs';
import {handleHeygenCompletion,buildPreparationCas,connectedRegistryCallbacks,decodeSqlRows} from '../scripts/operations/native-media-completion.mjs';
const now=Date.parse('2026-10-28T02:00:00Z'),at=new Date(now).toISOString();
function harness(t) {
  const request=fixture(),root=fs.mkdtempSync(path.join(os.tmpdir(),'brief-native-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  request.row.metadata.privateVideoLibrary={status:'succeeded',library_file_id:'libfile_mock_only',current_version_number:0,...request.identity};
  request.row.metadata.publication={published:true,history:['untouched']};
  request.row.metadata.mediaPreparation={oldEvidence:'preserve'};
  const event={registryId:request.row.id,videoId:request.row.metadata.videoGeneration.videoId};
  let row=structuredClone(request.row),writes=0,reads=0,decodes=0;
  const journal=[];
  const native=nativeStageCallbacks({root,receipts:path.join(root,'receipts'),existingPackage:request.existingPackage,now:()=>now,
    runTechnical:()=>{decodes++;return {originalAndHlsDecode:true,fullAuditoryReviewPerformed:false,fullMotionReviewPerformed:false,performanceApproval:false};}});
  const adapters={...native,now:()=>now,
    confirmExistingVideo:async()=>({...event,status:'completed',observedAt:at}),
    readRegistry:async()=>{reads++;return {row:structuredClone(row),observedAt:at};},
    materializeLibrary:async source=>({...source,status:'succeeded',path:request.source.path}),
    approvalFor:async()=>request.preparationApproval,
    journal:async e=>journal.push(e),
    compareAndSwapPreparation:async({previousRow,nextPreparation})=>{
      // Mock write boundary only. No test invokes connected production writes.
      writes++;assert.deepEqual(previousRow.metadata,row.metadata);
      row.metadata={...row.metadata,mediaPreparation:nextPreparation};return [structuredClone(row)];
    }
  };
  return {request,root,event,adapters,native,journal,get row(){return row;},set row(v){row=v;},get writes(){return writes;},get reads(){return reads;},get decodes(){return decodes;}};
}
test('native stages stop deliberately; real immutable fixture resumes through every boundary with mock CAS',async t=>{
  const h=harness(t),before=structuredClone(h.row.metadata.publication);
  for(const stage of ['ingest','package','technical','shelf']) {
    const r=await handleHeygenCompletion({event:h.event,mode:'persist',throughStage:stage},h.adapters);
    assert.equal(r.completedStages.at(-1),stage);
    if(stage==='ingest')assert.equal(fs.existsSync(path.join(h.root,'public/reels-hls')),false);
    if(stage==='package')assert.equal(h.decodes,0);
  }
  assert.equal(h.writes,4);assert.equal(h.decodes,1);
  assert.deepEqual(h.row.metadata.publication,before);assert.equal(h.row.metadata.mediaPreparation.oldEvidence,'preserve');
  const r=await handleHeygenCompletion({event:h.event,mode:'persist'},h.adapters);
  assert.equal(r.registryWriteAttempts,0);assert.equal(h.writes,4);assert.equal(h.decodes,1);
  // Lose local technical receipt: restore from confirmed registry evidence without repeat decode.
  fs.unlinkSync(path.join(h.root,'receipts',r.binding,'technical.json'));
  await handleHeygenCompletion({event:h.event,mode:'persist'},h.adapters);assert.equal(h.decodes,1);
  // Lose remote receipt: reconcile already hashed local checkpoint, then persist exactly once.
  delete h.row.metadata.mediaPreparation.checkpoints[`${r.binding}:technical`];
  await handleHeygenCompletion({event:h.event,mode:'persist'},h.adapters);assert.equal(h.writes,5);assert.equal(h.decodes,1);
  fs.rmSync(path.join(h.root,'public/reels-hls'),{recursive:true});
  const noRestore=nativeStageCallbacks({root:h.root,receipts:path.join(h.root,'receipts'),now:()=>now});
  await assert.rejects(handleHeygenCompletion({event:h.event,mode:'persist'},{...h.adapters,runStage:noRestore.runStage}),/Restore existing package/);
});
test('dry-run prepares all boundaries without any remote write, leaves published row untouched',async t=>{
  const h=harness(t),before=structuredClone(h.row);
  const r=await handleHeygenCompletion({event:h.event,mode:'dry-run'},h.adapters);
  assert.equal(r.registryWriteAttempts,0);assert.equal(h.writes,0);assert.deepEqual(h.row,before);
  assert.equal(r.completedStages.length,4);assert.equal(h.journal.filter(e=>e.status==='dry-run-no-registry-write').length,4);
});
test('full metadata CAS catches same updated_at collision; no automatic overwrite or retry',async t=>{
  const h=harness(t);let calls=0;
  h.adapters.compareAndSwapPreparation=async({previousRow,nextPreparation})=>{
    calls++;const sql=buildPreparationCas({previousRow,nextPreparation});
    assert.match(sql,/AND metadata =/);assert.doesNotMatch(sql,/updated_at/);
    h.row.metadata.concurrentEvidence='other actor';return [];
  };
  await assert.rejects(handleHeygenCompletion({event:h.event,mode:'persist'},h.adapters),/CAS updated zero/);
  assert.equal(calls,1);assert.equal(h.row.metadata.concurrentEvidence,'other actor');assert.equal(h.decodes,0);
});
test('uncertain write reconciles actual receipt; absent receipt stops with no retry',async t=>{
  for(const applied of [true,false]) {
    const h=harness(t),write=h.adapters.compareAndSwapPreparation;let attempts=0;
    h.adapters.compareAndSwapPreparation=async args=>{attempts++;if(applied)await write(args);throw Error('connection lost after send');};
    const task=handleHeygenCompletion({event:h.event,mode:'persist',throughStage:'ingest'},h.adapters);
    if(applied)assert.equal((await task).registryReceiptsConfirmed,1);else await assert.rejects(task,/uncertain/);
    assert.equal(attempts,1);assert.ok(h.journal.some(e=>e.status==='uncertain'));
  }
});
test('partial/wrong materialization, wrong provider, stale/revised row, expired authority fail truthfully',async t=>{
  for(const fault of ['partial','hash','provider','stale','revision','expiry']) {
    const h=harness(t);
    if(fault==='partial')h.adapters.materializeLibrary=async()=>({status:'succeeded',partial:true});
    if(fault==='hash')h.row.metadata.privateVideoLibrary.sha256='a'.repeat(64);
    if(fault==='provider')h.adapters.confirmExistingVideo=async()=>({videoId:'b'.repeat(32),status:'completed',observedAt:at});
    if(fault==='stale')h.adapters.readRegistry=async()=>({row:h.row,observedAt:'2026-10-27T00:00:00Z'});
    if(fault==='revision'){const read=h.adapters.readRegistry;h.adapters.readRegistry=async()=>{const s=await read();if(h.reads>1)s.row.metadata.scriptRevision='superseded';return s;};}
    if(fault==='expiry')h.request.preparationApproval.expiresAt=at;
    await assert.rejects(handleHeygenCompletion({event:h.event,mode:'persist'},h.adapters));assert.equal(h.writes,0);
  }
});
test('SQL callbacks preserve full JSON and safely quote; connected result decoding never invents success',async t=>{
  const h=harness(t);h.row.metadata.note="quote ' and $brief_cas$";
  const sql=buildPreparationCas({previousRow:h.row,nextPreparation:{checkpoints:{}}});
  assert.match(sql,/\$brief_casx\$/);assert.match(sql,/RETURNING id, writer_slug, metadata/);
  assert.doesNotMatch(sql,/SET status|SET updated_at/);
  const calls=[],registry=connectedRegistryCallbacks(async args=>{calls.push(args);return [h.row];},()=>now);
  assert.equal((await registry.readRegistry({registryId:h.event.registryId})).row.id,h.row.id);
  assert.match(calls[0].query,/^SELECT/);
  assert.throws(()=>decodeSqlRows({content:[{type:'text',text:'{"result":"unknown"}'}]}),/Unrecognized/);
  assert.deepEqual(decodeSqlRows({content:[{type:'text',text:JSON.stringify({result:'<untrusted-data-test>\n[]\n</untrusted-data-test>'})}]}),[]);
});
test('actual completion CLI invokes connected callbacks over JSON lines in dry-run (mock tools, real original bytes)',async t=>{
  const h=harness(t),config=path.join(h.root,'config.json');
  // Real-time clock for executable bridge, not test helper's fixed date.
  const approval={...h.request.preparationApproval,expiresAt:new Date(Date.now()+3600000).toISOString()};
  fs.writeFileSync(config,JSON.stringify({event:h.event,mode:'dry-run',throughStage:'ingest',root:h.root,receipts:path.join(h.root,'cli-receipts'),preparationApproval:approval}));
  const child=spawn(process.execPath,['scripts/operations/native-media-completion-turn.mjs',config],{stdio:['pipe','pipe','pipe']});
  const seen=[],output=[];let stderr='';child.stderr.on('data',b=>stderr+=b);
  const lines=readline.createInterface({input:child.stdout});
  lines.on('line',line=>{
    const message=JSON.parse(line);output.push(message);if(message.type!=='callback')return;
    seen.push(message.callback);let result;
    if(message.callback==='confirmExistingVideo')result={videoId:h.event.videoId,status:'completed',observedAt:new Date().toISOString()};
    if(message.callback==='executeSql'){assert.match(message.args.query,/^SELECT/);result=[h.row];}
    if(message.callback==='materializeLibrary')result={...message.args,status:'succeeded',path:h.request.source.path};
    child.stdin.write(JSON.stringify({id:message.id,result})+'\n');
  });
  const code=await new Promise(resolve=>child.on('close',resolve));
  assert.equal(code,0,stderr+JSON.stringify(output));assert.deepEqual(seen,['confirmExistingVideo','executeSql','materializeLibrary','executeSql','executeSql']);
  assert.equal(output.at(-1).result.registryWriteAttempts,0);assert.equal(output.at(-1).result.completedStages[0],'ingest');
});
test('post-stage source changes stop; unrelated fresh metadata is preserved in CAS',async t=>{
  for(const sourceChanged of [true,false,'matchup']) {
    const h=harness(t),run=h.adapters.runStage;
    h.adapters.runStage=async input=>{const result=await run(input);if(sourceChanged==='matchup')h.row.metadata.matchupKey='superseded';else if(sourceChanged)h.row.metadata.sourcePackageSha256='e'.repeat(64);else h.row.metadata.newEvidence={keep:true};return result;};
    const task=handleHeygenCompletion({event:h.event,mode:'persist',throughStage:'ingest'},h.adapters);
    if(sourceChanged){await assert.rejects(task,/superseded after stage/);assert.equal(h.writes,0);}
    else{await task;assert.deepEqual(h.row.metadata.newEvidence,{keep:true});assert.equal(h.writes,1);}
  }
});
