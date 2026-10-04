// Standard-tier prices checked 2026-10-04. Keep a conservative, nonrefundable
// $0.10 reservation per call; do not reclaim unused reservation or failed calls.
export const MODEL='gpt-5.4-mini'
export const MAX_BYTES=48000,MAX_OUTPUT=3000
export function requestBody(instructions:string,input:any){
 const text='Return JSON only.\n'+JSON.stringify(input)
 if(new TextEncoder().encode(instructions+text).length>MAX_BYTES)throw new Error('Evidence exceeds capped request size')
 return {model:MODEL,service_tier:'default',store:false,instructions,input:text,max_output_tokens:MAX_OUTPUT,reasoning:{effort:'low'},text:{format:{type:'json_object'}}}
}
export async function cappedCall(db:any,purpose:string,instructions:string,input:any,fetcher=fetch){
 const body=requestBody(instructions,input)
 const key=Deno.env.get('OPENAI_API_KEY');if(!key)throw new Error('Model credential unavailable')
 const id=crypto.randomUUID()
 const {data:allowed,error}=await db.rpc('reserve_brief_call',{p_id:id,p_purpose:purpose})
 if(error||!allowed)throw new Error('Generation paused or weekend budget exhausted')
 try{
  const response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)})
  const raw=await response.json(),usage=raw.usage
  const {error:logError}=await db.from('brief_desk_usage').update({status:response.ok?'completed':'failed',input_tokens:usage?.input_tokens??null,output_tokens:usage?.output_tokens??null,estimated_usd:usage?(usage.input_tokens*.75+usage.output_tokens*4.5)/1e6:null}).eq('id',id)
  if(logError)throw logError
  if(!response.ok)throw new Error('Model request failed: '+response.status+' '+String(raw.error?.message||'').slice(0,300))
  const text=raw.output?.flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==='output_text')?.text
  return JSON.parse(text||'null')
 }catch(e){await db.from('brief_desk_usage').update({status:'failed_or_uncertain'}).eq('id',id);throw e}
}
