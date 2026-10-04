import {advanceRun} from './workflow.ts'
// Persist each stage, but do not wait a minute between dependent steps.
// The caller owns a four-minute lease; leave ample time before it expires.
export async function advanceBatch(db:any,models:any,budgetMs=90000){
 const started=Date.now();let result:any
 for(let step=0;step<8;step++){
  result=await advanceRun(db,models)
  if(result.idle||!['queued','pitched','selected','written'].includes(result.status)||Date.now()-started>=budgetMs)break
 }
 return result
}
