const omit=new Set(['$ref','uid','guid','logos','logo','headshot','color','alternateColor','links','href','shortDisplayName','shortName','abbreviation','typeId','wallclock','lastUpdated','broadcasts','geoBroadcasts','format','formatId','displayOrder','order','thumbnail','images','image','video','videos'])
export function compactEvidence(value:any):any{
 if(Array.isArray(value))return value.map(compactEvidence)
 if(!value||typeof value!=='object')return value
 return Object.fromEntries(Object.entries(value).filter(([key])=>!omit.has(key)).map(([key,v])=>[key,compactEvidence(v)]))
}
const pick=(v:any,keys:string[])=>Object.fromEntries(keys.filter(k=>v?.[k]!==undefined).map(k=>[k,v[k]]))
export function modelEvidence(input:any):any{
 const packet=input?.packet||input
 if(!packet.nfl?.details)return compactEvidence(input)
 const nfl=packet.nfl
 const articles=new Map()
 for(const d of nfl.details)for(const a of d.news?.articles||[])articles.set(a.id||a.headline,pick(a,['id','headline','description','story','published','lastModified']))
 const lean={...packet,nfl:{as_of:nfl.as_of,
  scoreboard:(nfl.scoreboard||[]).map((e:any)=>({id:e.id,name:e.name,date:e.date,status:e.status,competitions:(e.competitions||[]).map((c:any)=>({...pick(c,['date','status','attendance','neutralSite','notes','situation']),venue:c.venue?.fullName,competitors:(c.competitors||[]).map((t:any)=>({...pick(t,['id','homeAway','score','winner','records','linescores','leaders','statistics']),team:t.team?.displayName}))}))})),
  details:nfl.details.map((d:any)=>({...pick(d,['event','source','source_url','scoringPlays']),boxscore:{teams:(d.boxscore?.teams||[]).map((t:any)=>({team:t.team?.displayName,statistics:t.statistics})),players:(d.boxscore?.players||[]).map((t:any)=>({team:t.team?.displayName,statistics:(t.statistics||[]).map((g:any)=>({...pick(g,['name','text','labels','descriptions','totals']),athletes:(g.athletes||[]).map((r:any)=>({athlete:pick(r.athlete,['id','displayName']),stats:r.stats}))}))}))}})),
  reporting:[...articles.values()]
 }}
 return compactEvidence(input?.packet?{...input,packet:lean}:lean)
}
