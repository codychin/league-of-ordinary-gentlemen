#!/usr/bin/env node
// JSON-lines bridge for the existing authenticated agent turn, not a daemon/job.
// stdout requests must be answered by that turn's official connected tools.
import fs from 'node:fs';
import readline from 'node:readline';
import {handleHeygenCompletion,connectedRegistryCallbacks} from './native-media-completion.mjs';
import {nativeStageCallbacks} from './native-media-stage.mjs';
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if(!['dry-run','persist'].includes(config.mode))throw Error('Explicit mode required');
let sequence=0;const pending=new Map();
const emit=value=>process.stdout.write(JSON.stringify(value)+'\n');
const lines=readline.createInterface({input:process.stdin});
lines.on('line',line=>{
  try {const response=JSON.parse(line),p=pending.get(response.id);if(!p)throw Error('Unknown callback response');
    pending.delete(response.id);response.error?p.reject(Error(response.error)):p.resolve(response.result);
  }catch(error){for(const p of pending.values())p.reject(error);pending.clear();}
});
lines.on('close',()=>{for(const p of pending.values())p.reject(Error('Native callback channel closed; reconcile pending action'));pending.clear();});
const call=(callback,args)=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});emit({type:'callback',id,callback,args});});
try {
  const result=await handleHeygenCompletion(config,{
    ...nativeStageCallbacks(config),...connectedRegistryCallbacks(args=>call('executeSql',args)),
    confirmExistingVideo:args=>call('confirmExistingVideo',args),materializeLibrary:args=>call('materializeLibrary',args),
    approvalFor:async()=>config.preparationApproval
  });
  emit({type:'result',result});
}catch(error){emit({type:'blocked',reason:error.message});process.exitCode=1;}
finally{lines.close();}
