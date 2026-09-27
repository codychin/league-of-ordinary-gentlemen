export const dynamic='force-dynamic'

const ENGINE='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=scores'

export async function GET(){
  try{
    const response=await fetch(ENGINE,{cache:'no-store',headers:{Accept:'application/json'}})
    const data=await response.json()
    if(!response.ok||!data?.ok)throw new Error(data?.error||`score engine ${response.status}`)
    const ageSeconds=Math.max(0,Math.round((Date.now()-new Date(data.updatedAt).getTime())/1000))
    return Response.json({...data,ageSeconds,stale:ageSeconds>180},{headers:{'Cache-Control':'no-store, max-age=0'}})
  }catch(error){
    return Response.json({ok:false,source:'unavailable',stale:true,updatedAt:null,matchups:[],error:String(error?.message||error)},{status:503,headers:{'Cache-Control':'no-store, max-age=0'}})
  }
}
