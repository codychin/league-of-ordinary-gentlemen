// Agent-operated completion turn. Pure async orchestration: no keys, HTTP clients,
// polling, generation, Library fallback, or implicit registry write authorization.
export const preparationStages = ['ingest','package','technical','shelf'];
const need=(ok,message)=>{if(!ok)throw Error(message);};
const canonical=value=>JSON.stringify(value,(_,v)=>v && typeof v==='object' && !Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const same=(a,b)=>canonical(a)===canonical(b);
const fresh=(at,now)=>Number.isFinite(Date.parse(at)) && Date.parse(at)<=now && now-Date.parse(at)<=300000;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const hex=/^[a-f0-9]{64}$/;
function librarySource(row) {
  const p=row.metadata?.privateVideoLibrary;
  need(p?.status==='succeeded' && p.library_file_id && p.current_version_number!==undefined && Number.isSafeInteger(p.bytes) && p.bytes>0 && hex.test(p.sha256),'Existing successful privateVideoLibrary identity/hash/version required');
  return {libraryFileId:p.library_file_id,fileId:p.file_id,version:p.current_version_number,bytes:p.bytes,sha256:p.sha256};
}
function sourceState(row) {
  const m=row.metadata,g=m?.videoGeneration;
  return {id:row.id,writer:row.writer_slug||m?.writer||null,matchupKey:m?.matchupKey,videoGenerationId:m?.videoGenerationId,edition:m?.edition,season:m?.season,week:m?.week,kind:m?.kind,pair:m?.matchupTeamIds,
    source:m?.sourcePackageSha256,script:m?.scriptSha256,scriptRevision:m?.scriptRevision,scriptApproved:m?.scriptApproved,
    approvalStatus:m?.approvalStatus,videoId:g?.videoId,status:g?.status,voiceId:m?.voiceId||g?.voiceId,
    avatarId:g?.avatarId,sourceAudioSha256:g?.sourceAudioSha256,library:librarySource(row)};
}
function receiptAt(row,key,stage) {return row.metadata?.mediaPreparation?.checkpoints?.[`${key}:${stage}`];}
function withReceipt(previous,receipt) {
  const existing=previous.mediaPreparation;
  need(existing===undefined || (existing && typeof existing==='object' && !Array.isArray(existing)),'Existing mediaPreparation is not an object; reconcile');
  const checkpoints=existing?.checkpoints;
  need(checkpoints===undefined || (checkpoints && typeof checkpoints==='object' && !Array.isArray(checkpoints)),'Existing checkpoints are not an object; reconcile');
  const slot=`${receipt.binding}:${receipt.stage}`;
  need(!checkpoints?.[slot] || same(checkpoints[slot],receipt),'Conflicting confirmed receipt; never overwrite evidence');
  return {...existing,checkpoints:{...checkpoints,[slot]:receipt}};
}

// Moxie's existing completion handler calls this once for its existing video ID.
// Every connected callback is supplied by the active, already-authenticated turn.
export async function handleHeygenCompletion({event,mode='dry-run',throughStage='shelf'},adapters) {
  need(uuid.test(event?.registryId||'') && /^[a-f0-9]{32}$/.test(event?.videoId||''),'Exact registry/generation event required');
  need(['dry-run','persist'].includes(mode) && preparationStages.includes(throughStage),'Explicit mode/stage required');
  for(const name of ['confirmExistingVideo','readRegistry','materializeLibrary','inspectOriginal','approvalFor','runStage','journal'])need(typeof adapters[name]==='function',`Missing connected callback: ${name}`);
  if(mode==='persist')need(typeof adapters.compareAndSwapPreparation==='function','CAS callback required; no credential fallback');
  const now=adapters.now||Date.now,completed=[],dryRunReceipts=[];
  let stage='confirm',key,registryWriteAttempts=0;
  const journal=(status,detail={})=>adapters.journal({registryId:event.registryId,videoId:event.videoId,stage,status,...detail});
  const readRow=async()=>{
    const snapshot=await adapters.readRegistry({registryId:event.registryId});
    need(snapshot?.row?.id===event.registryId && fresh(snapshot.observedAt,now()),'Fresh exact authoritative registry read required');
    const row=snapshot.row;
    need(row.metadata?.videoGeneration?.videoId===event.videoId && row.metadata.videoGeneration.status==='completed','Registry completion/generation mismatch; never render again');
    return snapshot;
  };
  try {
    const provider=await adapters.confirmExistingVideo({videoId:event.videoId});
    need(provider?.videoId===event.videoId && provider.status==='completed' && fresh(provider.observedAt,now()),'Existing provider completion unconfirmed');
    let snapshot=await readRow();const initial=sourceState(snapshot.row),source=librarySource(snapshot.row);
    stage='materialize';await journal('incomplete');
    const materialized=await adapters.materializeLibrary(source);
    need(materialized && !materialized.partial && materialized.status==='succeeded' && materialized.path && materialized.libraryFileId===source.libraryFileId && String(materialized.version)===String(source.version),'Official Library materialization incomplete or wrong identity/version; stop without fallback');
    const inspected=await adapters.inspectOriginal({row:snapshot.row,path:materialized.path});
    need(inspected?.identity?.bytes===source.bytes && inspected.identity.sha256===source.sha256 && hex.test(inspected.binding||''),'Materialized original hash/size/binding mismatch');
    key=inspected.binding;
    const approval=await adapters.approvalFor({event,row:snapshot.row,identity:inspected.identity,binding:key,mode});
    need(approval?.binding===key && approval.status==='approved' && approval.evidence && Date.parse(approval.expiresAt)>now(),'Exact existing preparation authority required');
    for(const target of preparationStages.slice(0,preparationStages.indexOf(throughStage)+1)) {
      stage=target;snapshot=await readRow();need(same(sourceState(snapshot.row),initial),'Source revision superseded before resume');
      await journal('incomplete',{binding:key});
      // The stage runner restores only matching confirmed receipts. In dry-run mode,
      // local confirmed results are carried between stages, never written remotely.
      const result=await adapters.runStage({row:snapshot.row,observedAt:snapshot.observedAt,identity:inspected.identity,
        sourcePath:materialized.path,preparationApproval:approval,throughStage:target,dryRunReceipts});
      need(result?.binding===key && result.completedStage===target && result.checkpoint,'Stage did not confirm requested boundary');
      const data=result.checkpoint;
      need((target==='shelf'?data.preparationBinding:data.binding)===key,'Stage receipt binding mismatch');
      if(target==='technical')need(data.checks?.originalAndHlsDecode===true && data.checks.fullAuditoryReviewPerformed===false && data.checks.fullMotionReviewPerformed===false && data.checks.performanceApproval===false,'Technical-only decode evidence required');
      if(target==='shelf')need(data.publicationApproved===false && data.qaStatus==='technical_only_review_required','Shelf must remain unpublished/review-required');
      const receipt={scope:'technical-preparation-only',binding:key,stage:target,videoId:event.videoId,data};
      // Reread after the native command: do not CAS an obsolete pre-command snapshot.
      snapshot=await readRow();need(same(sourceState(snapshot.row),initial),'Source revision superseded after stage');
      if(mode==='dry-run') {
        dryRunReceipts.push(receipt);await journal('dry-run-no-registry-write',{binding:key});
      } else if(same(receiptAt(snapshot.row,key,target),receipt)) {
        await journal('confirmed-existing',{binding:key});
      } else {
        const nextPreparation=withReceipt(snapshot.row.metadata,receipt);
        await journal('registry-write-requested',{binding:key});
        let rows;
        try {registryWriteAttempts++;rows=await adapters.compareAndSwapPreparation({previousRow:snapshot.row,nextPreparation});}
        catch(error) {
          await journal('uncertain',{binding:key,reason:String(error.message||error)});
          const reconciled=await readRow();need(same(sourceState(reconciled.row),initial),'Source changed during uncertain write');
          need(same(receiptAt(reconciled.row,key,target),receipt),'Registry write outcome uncertain; receipt absent/conflicting, read before retry');
          rows=null; // Fresh read proves exact receipt; do not issue a second update.
        }
        if(Array.isArray(rows) && rows.length===0) {
          const reconciled=await readRow();
          need(same(sourceState(reconciled.row),initial),'Source changed after CAS collision');
          need(same(receiptAt(reconciled.row,key,target),receipt),'CAS updated zero rows; reconciled receipt absent/conflicting, stop before retry');
          rows=null;
        }
        if(rows!==null) {
          need(Array.isArray(rows) && rows.length===1,'CAS updated zero/multiple rows; reconcile, never overwrite or retry blindly');
          const expected={...snapshot.row.metadata,mediaPreparation:nextPreparation};
          need(rows[0].id===event.registryId && rows[0].writer_slug===snapshot.row.writer_slug && same(rows[0].metadata,expected),'CAS result differs from technical-only metadata patch');
        }
        const confirmed=await readRow();need(same(sourceState(confirmed.row),initial),'Source changed before receipt confirmation');
        need(same(receiptAt(confirmed.row,key,target),receipt),'Registry receipt not confirmed; stop before next stage');
        await journal('confirmed',{binding:key});
      }
      completed.push(target);
    }
    return {status:mode==='dry-run'?'dry-run-prepared-review-required':'prepared-review-required',binding:key,completedStages:completed,
      registryWriteAttempts,registryReceiptsConfirmed:mode==='persist'?completed.length:0,publicationPerformed:false,fullAuditoryReviewPerformed:false,fullMotionReviewPerformed:false};
  } catch(error) {
    await journal(/uncertain/.test(error.message)?'uncertain':'blocked',{binding:key,reason:error.message});throw error;
  }
}

function sqlJson(value) {
  const json=JSON.stringify(value);let tag='$brief_cas$';while(json.includes(tag))tag=tag.slice(0,-1)+'x$';
  return `${tag}${json}${tag}::jsonb`;
}
const sqlText=value=>value===null||value===undefined?'NULL':`'${String(value).replaceAll("'","''")}'`;
export function buildPreparationCas({previousRow,nextPreparation}) {
  need(uuid.test(previousRow?.id||'') && previousRow.metadata && !Array.isArray(previousRow.metadata),'Full authoritative previous metadata required');
  return `UPDATE public.brief_publication_articles\nSET metadata = jsonb_set(metadata, '{mediaPreparation}', ${sqlJson(nextPreparation)}, true)\nWHERE id = '${previousRow.id}'::uuid\n  AND metadata = ${sqlJson(previousRow.metadata)}\n  AND writer_slug IS NOT DISTINCT FROM ${sqlText(previousRow.writer_slug)}\nRETURNING id, writer_slug, metadata;`;
}
export function decodeSqlRows(result) {
  if(Array.isArray(result))return result;
  if(result?.isError)throw Error('Connected SQL action failed; reconcile write outcome');
  const structured=result?.structuredContent;
  if(Array.isArray(structured?.rows))return structured.rows;
  if(Array.isArray(structured?.result))return structured.result;
  const block=result?.content?.find(x=>x.type==='text');need(block,'SQL callback must return rows or connected tool result');
  const decoded=JSON.parse(block.text);if(Array.isArray(decoded))return decoded;
  if(Array.isArray(decoded.result))return decoded.result;
  const match=decoded.result?.match(/<untrusted-data-[^>]+>\s*(\[[\s\S]*?\])\s*<\/untrusted-data/);
  need(match,'Unrecognized SQL result; do not assume zero rows or execution');return JSON.parse(match[1]);
}
export function connectedRegistryCallbacks(executeSql,now=Date.now) {
  const project_id='dnzdbqycuuoonewcowis';
  return {
    readRegistry:async({registryId})=>{
      need(uuid.test(registryId),'Exact registry UUID required');
      const rows=decodeSqlRows(await executeSql({project_id,query:`SELECT id, writer_slug, metadata FROM public.brief_publication_articles WHERE id = '${registryId}'::uuid;`}));
      need(rows.length===1,'Exact registry row unavailable');return {row:rows[0],observedAt:new Date(now()).toISOString()};
    },
    compareAndSwapPreparation:async args=>decodeSqlRows(await executeSql({project_id,query:buildPreparationCas(args)}))
  };
}
