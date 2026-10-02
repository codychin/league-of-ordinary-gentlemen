const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://dnzdbqycuuoonewcowis.supabase.co';
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_oVFeqnL1WtrpB5BWZopBSw_rKScXieO';

const headers={apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY};

export async function getCanonicalPlayerAssets(players=[]){
  const refs=players.filter(Boolean).map(p=>({provider:p.provider,id:String(p.playerId||p.id||''),name:p.name||''})).filter(x=>x.id);
  if(!refs.length)return {};
  const clauses=refs.map(x=>`(provider.eq.${encodeURIComponent(x.provider)},provider_player_id.eq.${encodeURIComponent(x.id)})`);
  const idRes=await fetch(SUPABASE_URL+'/rest/v1/brief_player_provider_ids?select=provider,provider_player_id,player_id&or=('+clauses.join(',')+')',{headers,next:{revalidate:3600}});
  const ids=idRes.ok?await idRes.json():[];
  const playerIds=[...new Set(ids.map(x=>x.player_id))];
  if(!playerIds.length)return {};
  const pRes=await fetch(SUPABASE_URL+'/rest/v1/brief_players?select=id,canonical_name,headshot_url,espn_id,yahoo_id&id=in.('+playerIds.join(',')+')',{headers,next:{revalidate:3600}});
  const rows=pRes.ok?await pRes.json():[];
  const byId=Object.fromEntries(rows.map(x=>[x.id,x]));
  return Object.fromEntries(ids.map(x=>[`${x.provider}:${x.provider_player_id}`,byId[x.player_id]]).filter(x=>x[1]));
}

export const canonicalHeadshot=(assets,provider,id)=>assets?.[`${provider}:${id}`]?.headshot_url||'';
