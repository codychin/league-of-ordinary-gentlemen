#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {assetIdentity} from './release-preflight.mjs';
import {binding,preparationBinding,prepare,saveOnce} from './prepare-media.mjs';
import {preparationStages} from './native-media-completion.mjs';

export function nativeStageCallbacks({root,receipts,existingPackage,now=Date.now,runTechnical}) {
  return {
    inspectOriginal:async({row,path:file})=>{
      if(!fs.lstatSync(file).isFile())throw Error('Official materialization must be a regular file');
      const identity=assetIdentity(fs.readFileSync(file));
      return {identity,binding:preparationBinding(binding(row,identity))};
    },
    journal:async event=>saveOnce(path.join(receipts,`native-event-${randomUUID()}.json`),{...event,at:new Date(now()).toISOString()}),
    runStage:async input=>{
      const key=preparationBinding(binding(input.row,input.identity));
      const records=[...Object.values(input.row.metadata?.mediaPreparation?.checkpoints||{}),...(input.dryRunReceipts||[])];
      const matching=records.filter(r=>r.binding===key);
      for(const r of matching) {
        if(r.scope!=='technical-preparation-only' || !preparationStages.includes(r.stage) || r.videoId!==input.row.metadata.videoGeneration.videoId || (r.stage==='shelf'?r.data?.preparationBinding:r.data?.binding)!==key)throw Error('Invalid confirmed preparation receipt');
      }
      const packageReceipt=matching.find(r=>r.stage==='package');
      const packagePath=path.join(root,'public/reels-hls',input.row.metadata.videoGeneration.videoId);
      if(packageReceipt && !fs.existsSync(packagePath) && !existingPackage)throw Error('Restore existing package bytes before resume; confirmed package must not be encoded twice');
      for(const r of matching)saveOnce(path.join(receipts,key,`${r.stage}.json`),r.data);
      return prepare({request:{row:input.row,identity:input.identity,source:{kind:'file',path:input.sourcePath},preparationApproval:input.preparationApproval,existingPackage},
        current:()=>({row:input.row,observedAt:input.observedAt}),root,receipts,throughStage:input.throughStage,now,...(runTechnical?{runTechnical}:{})});
    }
  };
}
