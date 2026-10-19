'use client'

import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'

const INITIAL={source:'baseline',week:3,matchups:[
  {home:{name:'For the Love of the Kraft',score:5.6,projection:115.7},away:{name:"I'm a Skatt man",score:0,projection:144.4}},
  {home:{name:'Pollard Greens',score:31.9,projection:163.6},away:{name:'The All Ugly Team',score:21.6,projection:145.3}},
  {home:{name:'Kupp Kupp Doubs',score:0,projection:146.7},away:{name:'The Route 22 Clubhouse',score:0,projection:142.7}},
  {home:{name:'Lloyd of the Rings',score:-5.5,projection:124.7},away:{name:'Mr Hopkins Opus',score:0,projection:145.6}},
  {home:{name:"Shake 'N Baker",score:42.2,projection:156.8},away:{name:'DarkHorse Danir',score:0,projection:149.0}},
  {home:{name:'Royrek Tishmeshulam',score:7.5,projection:147.5},away:{name:'CeeDeep Shaheeded Rivalry',score:0,projection:149.8}}
]}

const nyParts=()=>{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date())
  const get=t=>parts.find(p=>p.type===t)?.value
  return {day:get('weekday'),hour:Number(get('hour')),minute:Number(get('minute'))}
}
const sundayWindow=()=>['Sun','Mon'].includes(nyParts().day)
const phase=()=>{
  const {day,hour}=nyParts()
  if(day==='Mon')return 'FINAL'
  if(day!=='Sun')return 'OFF'
  if(hour<13)return 'PREGAME'
  return 'LIVE'
}
const num=n=>Number(n||0).toFixed(1)

export default function SundayScoreStrip(){
  const [data,setData]=useState(INITIAL)
  const [freshness,setFreshness]=useState({stale:true,updatedAt:null})
  const [on,setOn]=useState(()=>sundayWindow())
  useEffect(()=>{
    const tick=()=>setOn(sundayWindow())
    tick()
    const clock=window.setInterval(tick,30000)
    return()=>window.clearInterval(clock)
  },[])
  useEffect(()=>{
    if(!on)return
    let alive=true
    const load=()=>fetch('/api/live-scores',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(!alive)return;if(d?.matchups?.length)setData(d);setFreshness({stale:Boolean(d?.stale),updatedAt:d?.updatedAt||null})}).catch(()=>setFreshness(x=>({...x,stale:true})))
    load()
    const timer=window.setInterval(load,15000)
    return()=>{alive=false;window.clearInterval(timer)}
  },[on])
  const slate=phase()
  const games=useMemo(()=>data?.matchups||[],[data])
  if(!on)return null
  return <section className="sundayLiveStrip" aria-label={`Week ${data?.week||3} scoreboard`}>
    <div className="sundayLiveStripHead">
      <div className="weekScoreBrand"><div className="weekScoreLabel"><small>WEEK</small><b>{data?.week||3}</b></div><div className="weekScoreEdition"><strong>THE BRIEF</strong><small>NFL SUNDAY</small></div></div>
      <div className="liveStripMeta"><span>{slate}</span><small className={freshness.stale?'scoreStale':''}>{freshness.stale?'SCORES DELAYED':data?.source==='espn'?'LIVE SCORE FEED':'VERIFIED SNAPSHOT'}{freshness.updatedAt?` • ${new Date(freshness.updatedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})}`:''}</small><Link href="#live-desk">NEWSROOM ↓</Link></div>
    </div>
    <div className="liveScoreRail">
      {games.map((g,i)=>{
        const status=g.winner&&g.winner!=='UNDECIDED'?'FINAL':(data?.source==='espn'?slate:(slate==='PREGAME'?'PREGAME':'SNAPSHOT'))
        return <article className="liveScoreCard" key={g.id||i}>
          <div className="liveScoreStatus">{status}</div>
          <div className="liveScoreTeam"><span>{g.home?.name}</span><b>{num(g.home?.score)}</b></div>
          <div className="liveScoreTeam"><span>{g.away?.name}</span><b>{num(g.away?.score)}</b></div>
          <div className="liveScoreProj"><span>{num(g.home?.projection)} PROJ</span><span>{num(g.away?.projection)} PROJ</span></div>
        </article>
      })}
    </div>
  </section>
}
