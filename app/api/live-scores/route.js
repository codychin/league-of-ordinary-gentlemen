export const dynamic='force-dynamic'

const SCORES='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=scores'
const TICK='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=tick'
const MAX_AGE_SECONDS=60

const readScores=async()=>{
  const response=await fetch(SCORES,{cache:'no-store',headers:{Accept:'application/json'}})
  const data=await response.json()
  if(!response.ok||!data?.ok)throw new Error(data?.error||`score engine ${response.status}`)
  return data
}

export async function GET(){
  try{
    let data=await readScores()
    let ageSeconds=Math.max(0,Math.round((Date.now()-new Date(data.updatedAt).getTime())/1000))

    // The client polls this route during Sunday. If the persisted snapshot is stale,
    // advance the Sunday engine first so every Brief surface converges on fresh scores.
    if(ageSeconds>MAX_AGE_SECONDS){
      const tick=await fetch(TICK,{cache:'no-store',headers:{Accept:'application/json'}})
      if(tick.ok){
        data=await readScores()
        ageSeconds=Math.max(0,Math.round((Date.now()-new Date(data.updatedAt).getTime())/1000))
      }
    }

    return Response.json({...data,ageSeconds,stale:ageSeconds>MAX_AGE_SECONDS},{headers:{'Cache-Control':'no-store, max-age=0'}})
  }catch(error){
    return Response.json({ok:false,source:'unavailable',stale:true,updatedAt:null,matchups:[],error:String(error?.message||error)},{status:503,headers:{'Cache-Control':'no-store, max-age=0'}})
  }
}
