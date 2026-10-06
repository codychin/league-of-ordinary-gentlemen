import {isStaging} from './environment';
import snapshot from '../data/staging-snapshot.json';
import assets from '../data/staging-player-assets.json';
const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://dnzdbqycuuoonewcowis.supabase.co';
const SUPABASE_PUBLISHABLE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_oVFeqnL1WtrpB5BWZopBSw_rKScXieO';

export async function getEditionData(slug){
  if(isStaging){if(!snapshot.editions[slug])throw new Error("Missing staging edition: "+slug);return structuredClone(snapshot.editions[slug]);}
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

export async function getEditionArticles(slug,articleSlug=null){
  if(isStaging)return structuredClone((snapshot.articles[slug]||[]).filter(a=>!articleSlug||a.slug===articleSlug));
  const res=await fetch(SUPABASE_URL+'/rest/v1/rpc/get_public_brief_articles',{
    method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({p_slug:slug,p_article_slug:articleSlug}),cache:'no-store',
  });
  if(!res.ok) throw new Error('Could not load edition stories');
  return res.json();
}


export async function getNflHeadshotsByYahooId(){
  try{
    const url='https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv';
    const res=await fetch(url,{next:{revalidate:86400}});
    if(!res.ok)return {};
    const text=await res.text();
    const parse=line=>{
      const out=[];let cur='',quoted=false;
      for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){out.push(cur);cur=''}else cur+=ch}
      out.push(cur);return out;
    };
    const lines=text.split(/\r?\n/).filter(Boolean),header=parse(lines[0]);
    const yi=header.indexOf('yahoo_id'),hi=header.indexOf('headshot_url'),ei=header.indexOf('espn_id');
    if(yi<0)return {};
    const map={};
    for(let i=1;i<lines.length;i++){const row=parse(lines[i]),y=row[yi];if(!y)continue;const h=hi>=0?row[hi]:'';const e=ei>=0?row[ei]:'';if(h)map[String(y)]=h;else if(e)map[String(y)]=`https://a.espncdn.com/i/headshots/nfl/players/full/${e}.png`;}
    // Canonical DB overrides cover provider mappings that upstream roster data can miss.
    try{
      const ids=['29235','40030'];
      if(isStaging){for(const p of Object.values(assets))if(p.yahoo_id&&p.headshot_url)map[String(p.yahoo_id)]=p.headshot_url;return map;}
      const cr=await fetch(SUPABASE_URL+'/rest/v1/brief_players?select=yahoo_id,headshot_url&yahoo_id=in.('+ids.join(',')+')',{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+SUPABASE_PUBLISHABLE_KEY},next:{revalidate:3600}});
      if(cr.ok){for(const p of await cr.json())if(p.yahoo_id&&p.headshot_url)map[String(p.yahoo_id)]=p.headshot_url}
    }catch{}
    return map;
  }catch{return {}}
}
