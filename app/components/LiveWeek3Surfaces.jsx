'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import ResilientImage from './ResilientImage';

const num=n=>Number(n||0).toFixed(1);
const slugMap={
  "For the Love of the Kraft":"kraft","I'm a Skatt man":"skatt","I'm a Skatt Man":"skatt",
  "Pollard Greens":"pollard-greens","The All Ugly Team":"all-ugly","Kupp Kupp Doubs":"kupp-doubs",
  "The Route 22 Clubhouse":"route-22","Lloyd of the Rings":"lloyd-rings","Mr Hopkins Opus":"hopkins-opus",
  "Shake 'N Baker":"shake-baker","Shake ’N Baker":"shake-baker","DarkHorse Danir":"danir",
  "Royrek Tishmeshulam":"royrek","CeeDeep Shaheeded Rivalry":"ceedeep"
};

export default function LiveWeek3Surfaces({matchupPairs=[],teamVisuals={}}){
  const [data,setData]=useState(null);
  useEffect(()=>{
    let alive=true;
    const load=()=>fetch('/api/live-scores',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive&&d?.matchups?.length)setData(d)}).catch(()=>{});
    load();
    const timer=window.setInterval(load,15000);
    return()=>{alive=false;window.clearInterval(timer)};
  },[]);
  const games=useMemo(()=>data?.matchups||[],[data]);
  if(!games.length)return null;

  return <>
    <section className="section upcoming" id="week3">
      <div className="scoreHero"><div><small>THE BRIEF • WEEK 3</small><h2>Week 3</h2></div><span>LIVE SCORE ENGINE • AUTO-REFRESH</span></div>
      <div className="upcomingGrid">{games.map((g,i)=>{
        const left=slugMap[g.home?.name],right=slugMap[g.away?.name];
        const note=matchupPairs.find(x=>(x[0]===left&&x[1]===right)||(x[0]===right&&x[1]===left))?.[2]||'WEEK 3';
        return <Link className="matchupLink" href={left&&right?`/matchups/${left}/${right}`:'#scores'} key={g.id||i}><article className="playerHeadlineMatchup">
          <small className="matchupKicker">{note}</small>
          <div className="matchupPortraits" aria-hidden="true"><ResilientImage className="leftPlayer" src={teamVisuals[left]?.image||''} alt={teamVisuals[left]?.player||'Player'}/><ResilientImage className="rightPlayer" src={teamVisuals[right]?.image||''} alt={teamVisuals[right]?.player||'Player'}/></div>
          <div className="matchupEditorial"><div className="matchupSide left"><b>{g.home?.name}</b><strong>{num(g.home?.score)}</strong><em>{num(g.home?.projection)} PROJECTED</em></div><i>VS</i><div className="matchupSide right"><b>{g.away?.name}</b><strong>{num(g.away?.score)}</strong><em>{num(g.away?.projection)} PROJECTED</em></div></div>
          <div className="matchupPlayers"><span>{teamVisuals[left]?.player||''}</span><span>{teamVisuals[right]?.player||''}</span></div><span className="matchupOpen">OPEN MATCHUP →</span>
        </article></Link>
      })}</div>
    </section>
    <section className="section scoreSection" id="scores">
      <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week 3</h2></div><span>{data?.stale?'SCORES DELAYED':'LIVE ENGINE'}{data?.updatedAt?` • UPDATED ${new Date(data.updatedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})}`:''}</span></div>
      <div className="scores">{games.map((g,i)=><div className="match" key={g.id||i}><div><b>{g.home?.name}</b><strong>{num(g.home?.score)}</strong></div><div><span>{g.away?.name}</span><strong>{num(g.away?.score)}</strong></div></div>)}</div>
    </section>
  </>;
}
