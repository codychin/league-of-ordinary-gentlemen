import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
import * as models from './model.ts'
import {advanceBatch} from './cadence.ts'
import {advanceEdition} from './edition.ts'
const db=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json=(x:any,s=200)=>Response.json(x,{status:s,headers:{'Access-Control-Allow-Origin':'*'}})
async function advanceLoog(d:any){
 const slug='league-of-ordinary-gentlemen',owner=crypto.randomUUID()
 const {data:claimed,error}=await d.rpc('claim_edition_desk',{p_slug:slug,p_owner:owner})
 if(error)throw error
 if(!claimed)return {ok:true,busy:true}
 try{return await advanceBatch(d,models)}
 finally{await d.from('brief_edition_desk_leases').update({until_at:new Date().toISOString()}).eq('edition_slug',slug).eq('owner',owner)}
}
Deno.serve(async req=>{
 try {
  const d=db()
  const results=await Promise.allSettled([advanceLoog(d),advanceEdition(d,models)])
  const result=(r:any)=>r.status==='fulfilled'?r.value:{ok:false,error:String(r.reason?.message||r.reason)}
  return json({...result(results[0]),editions:{'sunday-crew':result(results[1])}})
 }
 catch(e) { return json({ok:false,error:String((e as Error)?.message||e)},500) }
})
