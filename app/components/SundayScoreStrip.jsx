'use client'

import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'

const nyParts=()=>{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date())
  const get=t=>parts.find(p=>p.type===t)?.value
  return {day:get('weekday'),hour:Number(get('hour')),minute:Number(get('minute'))}
}
const sundayWindow=()=>nyParts().day==='Sun'
const phase=()=>{
  const {day,hour}=nyParts()
  if(day!=='Sun')return 'OFF'
  if(hour<13)return 'PREGAME'
  return 'LIVE'
}
const num=n=>Number(n||0).toFixed(1)

export default function SundayScoreStrip(){
  const [data,setData]=useState(null)
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
    const load=()=>fetch('/api/live-scores',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive)setData(d)}).catch(()=>{})
    load()
    const timer=window.setInterval(load,30000)
    return()=>{alive=false;window.clearInterval(timer)}
  },[on])
  const slate=phase()
  const games=useMemo(()=>data?.matchups||[],[data])
  if(!on)return null
  return <section className="sundayLiveStrip" aria-label="Week 3 live scoreboard">
    <div className="sundayLiveStripHead">
      <div><span className="livePulse"/><b>SUNDAY LIVE</b><small>WEEK {data?.week||3}</small></div>
      <div className="liveStripMeta"><span>{slate}</span><small>{data?.source==='espn'?'ESPN SCORE FEED':'SCORE FEED CONNECTING'}</small><Link href="#live-desk">NEWSROOM ↓</Link></div>
    </div>
    <div className="liveScoreRail">
      {games.map((g,i)=>{
        const status=g.winner&&g.winner!=='UNDECIDED'?'FINAL':slate
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
