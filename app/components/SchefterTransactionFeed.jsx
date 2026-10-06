const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media'

const fmtDate=date=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric'}).format(new Date(date+'T12:00:00-04:00')).toUpperCase()

const outbidContext=(t,failed)=>{
  if(t.type!=='waiver'||!t.add)return ''
  const losers=failed.filter(x=>x.add===t.add&&x.team!==t.team).sort((a,b)=>(b.faab||0)-(a.faab||0))
  if(!losers.length)return ''
  const top=losers[0]
  const names=losers.slice(0,3).map(x=>x.team)
  if(losers.length===1)return ' '+top.team+' also wanted '+t.add+' for '+top.faab+'. The market has issued a correction.'
  if(losers.length===2)return ' '+names[0]+' ('+losers[0].faab+') and '+names[1]+' ('+losers[1].faab+') were both informed that wanting something and paying for it remain separate concepts.'
  return ' '+names.join(', ')+' and '+(losers.length-3)+' other bidder'+(losers.length-3===1?'':'s')+' also entered the room. None left with '+t.add+'.'
}

const copy=(t,failed)=>{
  if(t.type==='drop'&&!t.add)return 'ROSTER MOVE: '+t.team+' released '+t.drop+'. One fewer name to explain at the next meeting.'
  if(t.type==='trade') return '🚨 TRADE: '+t.team+' completed a trade involving '+[t.add,t.drop].filter(Boolean).join(' / ')+'. Paperwork filed; group chat consequences pending.'
  if(t.type==='waiver'){
    const base='🚨 WAIVER: '+t.team+' landed '+(t.add||'a player')+' for '+(t.faab??0)+(t.drop?' and released '+t.drop:'')+'.'
    if((t.faab||0)>=40)return base+' This was not a bid so much as a hostile acquisition.'+outbidContext(t,failed)
    if((t.faab||0)>=15)return base+' A real amount of FAAB has now become a real opinion.'+outbidContext(t,failed)
    return base+outbidContext(t,failed)
  }
  if(t.add?.includes('D/ST')||t.add==='Bills'||t.add==='Bears'||t.add==='Browns'||t.add==='Packers'||t.add==='Ravens'||t.add==='Rams') return 'ROSTER MOVE: '+t.team+' added '+t.add+(t.drop?' and released '+t.drop:'')+'. The weekly defense rental market remains completely normal and dignified.'
  if((t.faab||0)>=40) return '🚨 WAIVER: '+t.team+' landed '+(t.add||'a player')+' for '+t.faab+(t.drop?' and released '+t.drop:'')+'. This was not a bid so much as a hostile acquisition.'
  if((t.faab||0)>=15) return '🚨 WAIVER: '+t.team+' landed '+(t.add||'a player')+' for '+t.faab+(t.drop?' and released '+t.drop:'')+'. A real amount of FAAB has now become a real opinion.'
  return 'ROSTER MOVE: '+t.team+' added '+(t.add||'a player')+(t.drop?' and released '+t.drop:'')+'. Free agency: because sometimes patience means waiting until 9:04 a.m.'
}

export default function SchefterTransactionFeed({transactions=[],week=4}){
  const successful=transactions.filter(t=>t.status==='complete')
  const failed=transactions.filter(t=>t.status==='failed')
  if(!successful.length)return <div className="parodyNote">NO WEEK {week} TRANSACTIONS HAVE CLEARED YET.</div>
  return <div className="schefterFeed">{successful.map(t=><article className="schefterPost" key={t.id}>
    <img loading="lazy" decoding="async" src={MEDIA+'/transactions/schefter-tipped-off.png'} alt="Adam Schefter Tipped Off"/>
    <div className="schefterBody">
      <div className="schefterMeta"><b>Adam Schefter</b><span className="verified">✓</span><span>@AdamSchefter · {fmtDate(t.date)}</span><i>•••</i></div>
      <p>{copy(t,failed)}</p>
      <div className="schefterEngagement"><span>VERIFIED</span><span>{String(t.type).toUpperCase()}</span>{(t.faab||0)>0&&<span>FAAB {t.faab}</span>}{week!=null&&<span>WEEK {week}</span>}</div>
    </div>
  </article>)}</div>
}
