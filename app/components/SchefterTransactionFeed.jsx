const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media'

const fmtDate=date=>date?new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric'}).format(new Date(date+'T12:00:00-04:00')).toUpperCase():'RECENT'
const hash=value=>String(value||'').split('').reduce((sum,ch)=>sum+ch.charCodeAt(0),0)
const pick=(t,options)=>options[hash(t.id)%options.length]
const isDefense=position=>position==='D/ST'||position==='DEF'
const playerLabel=(name,position)=>isDefense(position)&&name&&!name.includes('D/ST')?name+' D/ST':name
const sentence=value=>/[.!?]$/.test(value)?value:value+'.'

const outbidContext=(t,failed)=>{
  if(t.type!=='waiver'||!t.add)return ''
  const bids=new Map()
  failed.filter(x=>x.date===t.date&&x.add===t.add&&x.team!==t.team).forEach(x=>{
    const prior=bids.get(x.team)
    if(!prior||Number(x.faab||0)>Number(prior.faab||0))bids.set(x.team,x)
  })
  const losers=[...bids.values()].sort((a,b)=>(b.faab||0)-(a.faab||0))
  if(!losers.length)return ''
  const bid=x=>x.team+' ($'+x.faab+')'
  if(losers.length===1){
    const gap=Math.max(0,Number(t.faab||0)-Number(losers[0].faab||0))
    return gap===0?' '+losers[0].team+' also bid $'+losers[0].faab+'. Waiver priority supplied the knife.':' '+losers[0].team+' finished $'+gap+' short at $'+losers[0].faab+'. The market has issued its ruling.'
  }
  if(losers.length===2)return ' '+bid(losers[0])+' and '+bid(losers[1])+' also filed claims. Both are now exhibits.'
  const leaders=losers.slice(0,3).map(bid).join(', ')
  const more=losers.length-3
  return ' '+leaders+(more>0?' and '+more+' more':'')+' submitted losing bids. Consensus did not confer custody.'
}

const aside=t=>{
  if(isDefense(t.addPosition)&&isDefense(t.dropPosition))return pick(t,[
    'The defense rental desk changed the locks before lunch.',
    'One matchup streamer out, another seven-day lease in.',
    'The schedule, not loyalty, remains general manager.',
  ])
  if(t.addPosition==='QB'&&t.dropPosition==='QB')return pick(t,[
    'The quarterback room has been panic-cleaned.',
    'One emergency contact replaced another.',
    'The depth chart has changed passwords again.',
  ])
  if(t.addPosition==='TE'&&t.dropPosition==='TE')return pick(t,[
    'Tight end certainty remains unavailable in this market.',
    'The position carousel has accepted another rider.',
    'A new answer arrived for the league’s least answerable position.',
  ])
  if((t.faab||0)>=30)return pick(t,[
    'This was not a claim so much as a capital-allocation event.',
    'The FAAB department has declined to discuss liquidity.',
    'Market price was located by driving directly through it.',
  ])
  if((t.faab||0)>=15)return pick(t,[
    'A real amount of FAAB has now become a real opinion.',
    'Conviction has entered the ledger and cannot be refunded.',
    'Budget restraint was considered and released.',
  ])
  if(isDefense(t.addPosition))return pick(t,[
    'The weekly defense rental market remains completely normal and dignified.',
    'Another defense has received a seven-day lease and no promises.',
    'Matchup streaming continues its quiet assault on roster continuity.',
  ])
  if(t.addPosition==='QB')return pick(t,[
    'The quarterback room has been reorganized pending the next panic.',
    'A new quarterback enters the group chat with provisional status.',
    'The depth chart now has a fresh emergency contact.',
  ])
  if(t.addPosition==='TE')return pick(t,[
    'Tight end certainty remains a rumor, but the search continues.',
    'The league-wide tight end support group welcomes another transaction.',
    'A new solution has been proposed to the position that resists solutions.',
  ])
  if(t.addPosition==='K')return pick(t,[
    'Special teams has a new nameplate.',
    'A kicker move: proof that no roster spot is beneath scrutiny.',
    'The margins have been adjusted, one field goal at a time.',
  ])
  if(!t.drop)return pick(t,[
    'An open roster spot finally found a purpose.',
    'No corresponding sacrifice was required. Luxury.',
    'The roster expanded emotionally, if not numerically.',
  ])
  return pick(t,[
    'A small transaction with large group-chat potential.',
    'The depth chart has been asked to absorb this quietly.',
    'No press conference is expected, which is probably for the best.',
    'The paperwork is complete. The confidence level remains private.',
    'A roster spot changed hands. Civilization continues.',
  ])
}

const copy=(t,failed)=>{
  const add=playerLabel(t.add,t.addPosition)||'a player'
  const drop=playerLabel(t.drop,t.dropPosition)
  if(t.type==='drop'&&!t.add)return pick(t,['ROSTER MOVE: ','League wire: ','Transaction desk: '])+sentence(t.team+' released '+drop)+' '+pick(t,[
    'The roster spot has been declared a vacancy.',
    'One fewer name to explain at the next meeting.',
    'The separation was described as mutual by exactly one side.',
  ])
  if(t.type==='trade')return sentence('🚨 TRADE: '+t.team+' completed a trade involving '+[add,drop].filter(Boolean).join(' / '))+' '+pick(t,[
    'Paperwork filed; group-chat consequences pending.',
    'Everyone won the trade until kickoff.',
    'The physicals passed. The opinions will not.',
  ])
  if(t.type==='waiver'){
    const lead=pick(t,['🚨 WAIVER: ','Claim cleared: ','FAAB desk: ','Waiver wire: '])
    return lead+sentence(t.team+' landed '+add+' for $'+(t.faab??0)+(drop?' and released '+drop:''))+' '+aside(t)+outbidContext(t,failed)
  }
  const lead=pick(t,['ROSTER MOVE: ','League wire: ','Transaction desk: ','Sources: '])
  return lead+sentence(t.team+' added '+add+(drop?' and released '+drop:''))+' '+aside(t)
}

export default function SchefterTransactionFeed({transactions=[],week=null,maxItems=20}){
  const successful=transactions.filter(t=>t.status==='complete'&&['add','drop','waiver','trade'].includes(t.type)&&(t.add||t.drop||t.tradeSides?.length)).slice(0,maxItems)
  const failed=transactions.filter(t=>t.status==='failed')
  if(!successful.length)return <div className="parodyNote">NO TRANSACTIONS HAVE CLEARED YET.</div>
  return <div className="schefterFeed">{successful.map(t=><article className="schefterPost" key={t.id}>
    <img loading="lazy" decoding="async" src={MEDIA+'/transactions/schefter-tipped-off.png'} alt="Adam Schefter Tipped Off"/>
    <div className="schefterBody">
      <div className="schefterMeta"><b>Adam Schefter</b><span className="verified">✓</span><span>@AdamSchefter · {fmtDate(t.date)}</span><i>•••</i></div>
      <p>{copy(t,failed)}</p>
      <div className="schefterEngagement"><span>VERIFIED</span><span>{String(t.type).toUpperCase()}</span>{(t.faab||0)>0&&<span>FAAB ${t.faab}</span>}{week!=null&&<span>WEEK {week}</span>}</div>
    </div>
  </article>)}</div>
}
