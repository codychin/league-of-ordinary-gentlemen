import latestScores from '../../../data/latest-loog-scores.json';
import completedScores from '../../../data/completed-loog-scores.json';
import {selectLoogScores} from '../../../lib/select-loog-scores.mjs';
export const dynamic='force-dynamic'

const SCORES='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=scores'
const MAX_AGE_SECONDS=60

const readScores=async()=>{
  const response=await fetch(SCORES,{cache:'no-store',headers:{Accept:'application/json'}})
  const data=await response.json()
  if(!response.ok||!data?.ok)throw new Error(data?.error||`score engine ${response.status}`)
  return data
}

export async function GET(){
  try{
    const data=selectLoogScores({provider:await readScores(),latest:latestScores,completed:completedScores})
    let ageSeconds=Math.max(0,Math.round((Date.now()-new Date(data.updatedAt).getTime())/1000))

    // Snapshot-only read: authenticated scheduled refreshes own score writes.
    const final=data.status==='FINAL'||(data.matchups?.length>0&&data.matchups.every(g=>g.winner&&g.winner!=='UNDECIDED'))

    return Response.json({...data,ageSeconds,stale:!final&&ageSeconds>MAX_AGE_SECONDS},{headers:{'Cache-Control':'no-store, max-age=0'}})
  }catch(error){
    const data=selectLoogScores({latest:latestScores,completed:completedScores})
    return Response.json({...data,stale:true},{headers:{'Cache-Control':'no-store'}})
  }
}
