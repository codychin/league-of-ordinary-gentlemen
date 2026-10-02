'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import MatchupCardGrid from './MatchupCardGrid';

const num=n=>Number(n||0).toFixed(1);
const slugMap={
  "For the Love of the Kraft":"kraft","I'm a Skatt man":"skatt","I'm a Skatt Man":"skatt",
  "Pollard Greens":"pollard-greens","The All Ugly Team":"all-ugly","Kupp Kupp Doubs":"kupp-doubs",
  "The Route 22 Clubhouse":"route-22","Lloyd of the Rings":"lloyd-rings","Mr Hopkins Opus":"hopkins-opus",
  "Shake 'N Baker":"shake-baker","Shake ’N Baker":"shake-baker","DarkHorse Danir":"danir",
  "Royrek Tishmeshulam":"royrek","CeeDeep Shaheeded Rivalry":"ceedeep"
};

export default function LiveWeek3Surfaces({matchupPairs=[],teamVisuals={},finalWeek=false}){
  const [data,setData]=useState(null);
  useEffect(()=>{
    let alive=true;
    const load=()=>fetch('/api/live-scores',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive&&d?.matchups?.length)setData(d)}).catch(()=>{});
    load();
    const timer=window.setInterval(load,15000);
    return()=>{alive=false;window.clearInterval(timer)};
  },[]);
  const games=useMemo(()=>data?.matchups||[],[data]);
  if(!games.length||finalWeek)return null;

  return <>
    <section className="section upcoming" id="week4">
      <div className="scoreHero"><div><small>THE BRIEF • WEEK 4</small><h2>Week 4</h2></div><span>LIVE SCORE ENGINE • AUTO-REFRESH</span></div>
      <MatchupCardGrid cards={games.map((g,i)=>{
        const left=slugMap[g.home?.name],right=slugMap[g.away?.name];
        const note=matchupPairs.find(x=>(x[0]===left&&x[1]===right)||(x[0]===right&&x[1]===left))?.[2]||'WEEK 4';
        return {id:g.id||i,href:left&&right?`/matchups/${left}/${right}`:'#week4',kicker:note,leftName:g.home?.name,leftScore:num(g.home?.score),leftProjection:num(g.home?.projection),leftImage:teamVisuals[left]?.image||'',rightName:g.away?.name,rightScore:num(g.away?.score),rightProjection:num(g.away?.projection),rightImage:teamVisuals[right]?.image||''};
      })}/>
    </section>
    <section className="section scoreSection" id="scores">
      <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week 4</h2></div><span>{data?.stale?'SCORES DELAYED':'LIVE ENGINE'}{data?.updatedAt?` • UPDATED ${new Date(data.updatedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})}`:''}</span></div>
      <div className="scores">{games.map((g,i)=><div className="match" key={g.id||i}><div><b>{g.home?.name}</b><strong>{num(g.home?.score)}</strong></div><div><span>{g.away?.name}</span><strong>{num(g.away?.score)}</strong></div></div>)}</div>
    </section>
  </>;
}
