import {isStaging} from '../../../lib/environment';
import stagingDetails from '../../../data/staging-live-details.json';
export const dynamic='force-dynamic';
const DETAIL='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=details';
export async function GET(){
 if(isStaging)return Response.json({...stagingDetails,staging:true},{headers:{'Cache-Control':'no-store'}});
 try{
  const r=await fetch(DETAIL,{cache:'no-store'}),d=await r.json();
  const age=d?.updatedAt?Math.max(0,(Date.now()-new Date(d.updatedAt).getTime())/1000):9999;
  return Response.json({...d,ageSeconds:age,stale:!d?.ok||age>60},{status:r.ok?200:r.status,headers:{'Cache-Control':'no-store, max-age=0'}});
 }catch(e){return Response.json({ok:false,error:String(e?.message||e)},{status:503,headers:{'Cache-Control':'no-store, max-age=0'}})}
}
