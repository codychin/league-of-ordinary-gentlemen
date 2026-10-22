// Read-only archive. Independent keysets prevent one feed starving the other.
const columns='id,writer,tag,text,subject,thread,published_at,sort_time,source_url,source_name'
const zone='America/New_York'
export function sundayBounds(day:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Choose a Sunday (YYYY-MM-DD)')
  const date=new Date(day+'T12:00:00Z')
  if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==day||date.getUTCDay()!==0)throw new Error('Choose a valid Sunday')
  function midnight(d:string){
    const probe=new Date(d+'T12:00:00Z')
    const offset=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(probe).find(p=>p.type==='timeZoneName')!.value
    const hours=Number(offset.replace('GMT',''))
    // Noon can have the new offset on DST transition days; resolve midnight separately.
    let result=new Date(Date.parse(d+'T00:00:00Z')-hours*3600000)
    const actual=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(result).find(p=>p.type==='timeZoneName')!.value
    result=new Date(Date.parse(d+'T00:00:00Z')-Number(actual.replace('GMT',''))*3600000)
    return result.toISOString()
  }
  const next=new Date(date);next.setUTCDate(next.getUTCDate()+1)
  return {start:midnight(day),end:midnight(next.toISOString().slice(0,10))}
}
export function latestSunday(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
  const part=(name:string)=>parts.find(p=>p.type===name)!.value
  const d=new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d.toISOString().slice(0,10)
}
// Postgres timestamps can contain microseconds; Date.parse alone loses keyset order.
const stamp=(value:string)=>{const [base,fraction='']=value.replace(/(?:Z|\+00:00)$/,'').split('.');return base+'.'+fraction.padEnd(6,'0')}
type Key={time:string,id:string}|null
function validKey(k:any):k is Key{return k===null||(typeof k?.time==='string'&&/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|\+00:00)$/.test(k.time)&&Number.isFinite(Date.parse(k.time))&&typeof k.id==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(k.id))}
export async function readArchive(db:any,url:URL,now=new Date()){
  const edition=url.searchParams.get('edition')||''
  if(!['','sunday-crew','doge'].includes(edition))throw new Error('Unknown edition')
  const day=url.searchParams.get('date')||latestSunday(now)
  const {start,end}=sundayBounds(day)
  let cursor:any={day,edition,snapshot:now.toISOString(),global:null,local:null}
  if(url.searchParams.has('cursor')){
    try{const raw=url.searchParams.get('cursor')!;if(raw.length>2048)throw new Error('Oversized cursor');cursor=JSON.parse(atob(raw))}catch{throw new Error('Invalid cursor')}
    if(cursor.day!==day||cursor.edition!==edition||!validKey(cursor.global)||!validKey(cursor.local)||!Number.isFinite(Date.parse(cursor.snapshot))||Date.parse(cursor.snapshot)>+now)throw new Error('Invalid cursor')
  }
  const size=25
  async function load(table:string,key:Key,local:boolean){
    let q=db.from(table).select(columns).gte('published_at',start).lt('published_at',end).lte('published_at',cursor.snapshot)
    if(local){q=q.eq('status','live');if(edition)q=q.eq('edition_slug',edition)}
    if(key)q=q.or(`published_at.lt.${key.time},and(published_at.eq.${key.time},id.lt.${key.id})`)
    const {data,error}=await q.order('published_at',{ascending:false}).order('id',{ascending:false}).limit(size+1)
    if(error)throw error
    return (data||[]).map((p:any)=>({...p,_stream:local?'local':'global'}))
  }
  const [global,local]=await Promise.all([load('brief_global_live_posts',cursor.global,false),load(edition?'brief_edition_live_posts':'brief_live_desk_posts',cursor.local,true)])
  const all=[...global,...local].sort((a,b)=>stamp(b.published_at).localeCompare(stamp(a.published_at))||(a._stream===b._stream?(typeof a.id==='number'?b.id-a.id:String(b.id).localeCompare(String(a.id))):a._stream.localeCompare(b._stream)))
  const page=all.slice(0,size)
  for(const p of page)cursor[p._stream]={time:p.published_at,id:String(p.id)}
  return {edition:edition||'loog',date:day,timeZone:zone,snapshot:cursor.snapshot,posts:page.map(({_stream,...p})=>({...p,id:_stream+':'+p.id})),nextCursor:all.length>size?btoa(JSON.stringify(cursor)):null}
}
