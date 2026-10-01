const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://dnzdbqycuuoonewcowis.supabase.co';
const SUPABASE_PUBLISHABLE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_oVFeqnL1WtrpB5BWZopBSw_rKScXieO';

export async function getEditionData(slug){
  const res=await fetch(SUPABASE_URL+'/rest/v1/rpc/get_public_brief_edition',{
    method:'POST',
    headers:{
      apikey:SUPABASE_PUBLISHABLE_KEY,
      Authorization:'Bearer '+SUPABASE_PUBLISHABLE_KEY,
      'Content-Type':'application/json',
    },
    body:JSON.stringify({p_slug:slug}),
    cache:'no-store',
  });
  if(!res.ok) throw new Error('Edition RPC failed: '+res.status+' '+await res.text());
  return res.json();
}
