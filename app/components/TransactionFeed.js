'use client'
import {useEffect,useState} from 'react'

const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media'
const fmtDate=iso=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric'}).format(new Date(iso)).toUpperCase()
const itemOf=(t,type)=>t.items?.find(i=>i.type===type)?.player
const copy=t=>{
  const add=itemOf(t,'ADD'),drop=itemOf(t,'DROP'),failed=t.status!=='EXECUTED'
  if(t.type==='TRADE') return `🚨 TRADE: ${t.team} completed a league transaction involving ${t.items.map(i=>i.player).join(', ')}.`
  if(failed) return `WAIVER BID: ${t.team} submitted a ${t.bidAmount?'$'+t.bidAmount:'$0'} claim on ${add||'a player'}${drop?` with ${drop} designated to be dropped`:''}, but the claim did not execute.`
  if(t.type==='WAIVER') return `🚨 WAIVER: ${t.team} acquired ${add||'a player'} for ${t.bidAmount?'$'+t.bidAmount:'$0'}${drop?` and released ${drop}`:''}.`
  return `ROSTER MOVE: ${t.team} added ${add||'a player'}${drop?` and released ${drop}`:''}.`
}

export default function TransactionFeed(){
  const [state,setState]=useState({loading:true,week:null,transactions:[],error:null})
  useEffect(()=>{let active=true;fetch('/api/transactions',{cache:'no-store'}).then(r=>r.json()).then(d=>active&&setState({loading:false,week:d.week,transactions:d.transactions||[],error:d.ok?null:d.error||'Unavailable'})).catch(e=>active&&setState({loading:false,week:null,transactions:[],error:String(e)}));return()=>{active=false}},[])
  if(state.loading)return <div className="parodyNote">REFRESHING CURRENT LEAGUE TRANSACTIONS…</div>
  if(state.error)return <div className="parodyNote">TRANSACTION FEED TEMPORARILY UNAVAILABLE • LAST VERIFIED DATA WILL RETURN ON THE NEXT REFRESH</div>
  if(!state.transactions.length)return <div className="parodyNote">NO WEEK {state.week||''} TRANSACTIONS HAVE CLEARED YET.</div>
  return <div className="schefterFeed">{state.transactions.map(t=><article className="schefterPost" key={t.id}><img loading="lazy" decoding="async" src={`${MEDIA}/transactions/schefter-tipped-off.png`} alt="Adam Schefter Tipped Off"/><div className="schefterBody"><div className="schefterMeta"><b>Adam Schefter</b><span className="verified">✓</span><span>@AdamSchefter · {fmtDate(t.date)}</span><i>•••</i></div><p>{copy(t)}</p><div className="schefterEngagement"><span>{t.status==='EXECUTED'?'VERIFIED':'FAILED BID'}</span><span>{t.type}</span>{t.bidAmount>0&&<span>FAAB ${t.bidAmount}</span>}<span>WEEK {state.week}</span></div></div></article>)}</div>
}
