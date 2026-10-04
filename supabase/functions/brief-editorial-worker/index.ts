import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
import * as models from './model.ts'
import {advanceRun} from './workflow.ts'
import {advanceEdition} from './edition.ts'
const db=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json=(x:any,s=200)=>Response.json(x,{status:s,headers:{'Access-Control-Allow-Origin':'*'}})
Deno.serve(async req=>{
 try {
  const d=db()
  const results=await Promise.allSettled([advanceRun(d,models),advanceEdition(d,models)])
  const result=(r:any)=>r.status==='fulfilled'?r.value:{ok:false,error:String(r.reason?.message||r.reason)}
  return json({...result(results[0]),editions:{'sunday-crew':result(results[1])}})
 }
 catch(e) { return json({ok:false,error:String((e as Error)?.message||e)},500) }
})
