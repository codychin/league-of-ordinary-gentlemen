export const dynamic='force-dynamic';
const DETAIL='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=details';
const TICK='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=tick';
export async function GET(){
 try{
  let r=await fetch(DETAIL,{cache:'no-store'}),d=await r.json();
  const age=d?.updatedAt?Math.max(0,(Date.now()-new Date(d.updatedAt).getTime())/1000):9999;
  if(!r.ok||!d?.ok||age>60){await fetch(TICK,{cache:'no-store'});r=await fetch(DETAIL,{cache:'no-store'});d=await r.json();}
  return Response.json(d,{status:r.ok?200:r.status,headers:{'Cache-Control':'no-store, max-age=0'}});
 }catch(e){return Response.json({ok:false,error:String(e?.message||e)},{status:503,headers:{'Cache-Control':'no-store, max-age=0'}})}
}