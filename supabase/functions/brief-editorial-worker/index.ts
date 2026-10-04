import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
import {sharedDesk} from './shared.ts'
Deno.serve(async()=>{
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
 try{return Response.json(await sharedDesk(db))}
 catch(e){return Response.json({ok:false,error:String((e as Error)?.message||e)}, {status:500})}
})
