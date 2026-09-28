'use client'

import {useEffect,useState} from 'react'

const FALLBACK=[
  {home:{name:'For the Love of the Kraft',score:5.6},away:{name:"I'm a Skatt man",score:0}},
  {home:{name:'Pollard Greens',score:31.9},away:{name:'The All Ugly Team',score:21.6}},
  {home:{name:'Kupp Kupp Doubs',score:0},away:{name:'The Route 22 Clubhouse',score:0}},
  {home:{name:'Lloyd of the Rings',score:-5.5},away:{name:'Mr Hopkins Opus',score:0}},
  {home:{name:"Shake 'N Baker",score:42.2},away:{name:'DarkHorse Danir',score:0}},
  {home:{name:'Royrek Tishmeshulam',score:7.5},away:{name:'CeeDeep Shaheeded Rivalry',score:0}}
]
const score=n=>Number(n||0).toFixed(2)

export default function Week3Scoreboard(){
  const [data,setData]=useState({matchups:FALLBACK,stale:true,updatedAt:null,source:'baseline'})
  useEffect(()=>{
    let alive=true
    const load=()=>fetch('/api/live-scores',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive&&d?.matchups?.length)setData(d)}).catch(()=>{})
    load();const timer=setInterval(load,60000)
    return()=>{alive=false;clearInterval(timer)}
  },[])
  const games=data.matchups||FALLBACK
  const allFinal=games.length>0&&games.every(g=>g.winner&&g.winner!=='UNDECIDED')
  return <section className="section scoreSection" id="scores">
    <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week 3 {allFinal?'Final':'Live'}</h2></div><span>{allFinal?'FINAL SCORES • WEEK 3 IN THE BOOKS':data.stale?'LATEST VERIFIED SCORES':'LIVE SCORES • UPDATED AUTOMATICALLY'}</span></div>
    <div className="scores">{games.map((g,i)=>{
      const hs=Number(g.home?.score||0),as=Number(g.away?.score||0),final=g.winner&&g.winner!=='UNDECIDED'
      const homeLead=hs>as,awayLead=as>hs
      return <div className={`match ${final?'notable':''}`} key={g.id||i}>
        {final&&<small className="scoreNote">FINAL</small>}
        <div><b>{g.home?.name}</b><strong>{score(hs)}</strong></div>
        <div><span className={awayLead?'scoreWinner':''}>{g.away?.name}</span><strong>{score(as)}</strong></div>
      </div>
    })}</div>
  </section>
}
