'use client'

import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'
import {scoreStripPhase} from '../../lib/score-strip-status.mjs'

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
  const [data,setData]=useState(null)
  const [loadState,setLoadState]=useState('loading')
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
    const load=()=>fetch('/api/live-scores',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(!alive)return;if(!d?.matchups?.length)throw new Error('No scoreboard available');setData(d);setLoadState('ready');setFreshness({stale:Boolean(d?.stale),updatedAt:d?.updatedAt||null})}).catch(()=>{if(alive){setLoadState('error');setFreshness(x=>({...x,stale:true}))}})
    load()
    const timer=window.setInterval(load,15000)
    return()=>{alive=false;window.clearInterval(timer)}
  },[on])
  const slate=scoreStripPhase(data,phase())
  const games=useMemo(()=>data?.matchups||[],[data])
  if(!on)return null
  if(!data)return <section className="sundayLiveStrip" aria-label="Scoreboard"><p className="scoreLoading" role="status">{loadState==='error'?'The scoreboard is temporarily unavailable. Retrying shortly…':'Loading the latest scoreboard…'}</p></section>
  return <section className="sundayLiveStrip" aria-label={`Week ${data.week} scoreboard`}>
    <div className="sundayLiveStripHead">
      <div className="weekScoreBrand"><div className="weekScoreLabel"><small>WEEK</small><b>{data.week}</b></div><div className="weekScoreEdition"><strong>THE BRIEF</strong><small>NFL SUNDAY</small></div></div>
      <div className="liveStripMeta"><span>{slate}</span><small className={freshness.stale?'scoreStale':''}>{freshness.stale?'SCORES DELAYED':data?.source==='espn'?'LIVE SCORE FEED':'VERIFIED SNAPSHOT'}{freshness.updatedAt?` • ${new Date(freshness.updatedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})}`:''}</small><Link href="#live-desk">NEWSROOM ↓</Link></div>
    </div>
    <div className="liveScoreRail">
      {games.map((g,i)=>{
        const status=scoreStripPhase({matchups:[g]},phase())
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
