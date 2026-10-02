import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
import * as models from './model.ts'
import {advanceRun} from './workflow.ts'
const db=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json=(x:any,s=200)=>Response.json(x,{status:s,headers:{'Access-Control-Allow-Origin':'*'}})
Deno.serve(async req=>{
 try { return json(await advanceRun(db(),models)) }
 catch(e) { return json({ok:false,error:String((e as Error)?.message||e)},500) }
})
