'use client';
import matchupColumns from '../../data/week5-matchup-columns.json';
import {writers} from '../articles/writers';
import {useEffect,useState} from 'react';
import MatchupEditorialColumns from './MatchupEditorialColumns';
import MatchupCardGrid from './MatchupCardGrid';
const num=n=>n==null?'—':Number(n).toFixed(2);
const slugMap={"For the Love of the Kraft":"kraft","I'm a Skatt man":"skatt","I'm a Skatt Man":"skatt","Pollard Greens":"pollard-greens","The All Ugly Team":"all-ugly","Kupp Kupp Doubs":"kupp-doubs","The Route 22 Clubhouse":"route-22","Lloyd of the Rings":"lloyd-rings","Mr Hopkins Opus":"hopkins-opus","Shake 'N Baker":"shake-baker","Shake ’N Baker":"shake-baker","DarkHorse Danir":"danir","Royrek Tishmeshulam":"royrek","CeeDeep Shaheeded Rivalry":"ceedeep"};
export default function LiveWeek3Surfaces({matchupPairs=[],teamVisuals={},initialData=null,finalWeek=false}){
 const [data,setData]=useState(initialData);
 useEffect(()=>{
  let alive=true;
  const load=()=>fetch('/api/live-scores',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive&&d?.matchups?.length&&Number(d.week)>=Number(initialData?.week||0))setData(d)}).catch(()=>{});
  load();
  const timer=window.setInterval(load,60000);
  return()=>{alive=false;if(timer)window.clearInterval(timer)};
 },[initialData]);
 const games=data?.matchups||[];
 const week=data?.week||initialData?.week||4;
 const isFinal=data?.status==='FINAL'||(games.length>0&&games.every(g=>g.winner&&g.winner!=='UNDECIDED'));
 const pregame=!isFinal&&games.length>0&&games.every(g=>Number(g.home?.score||0)===0&&Number(g.away?.score||0)===0);
 if(finalWeek)return null;
 return <section className="section scoreSection" id="scores">
  <div className="scoreHero"><div><small>THE BRIEF • WEEK {week}</small><span id={'week'+week} aria-hidden="true"/><h2>Week {week}{isFinal?' Final':''}</h2></div><span>{isFinal?'FINAL SCORES':pregame?'THURSDAY • NEW MATCHUPS':'LATEST SCORES'}</span></div>
  {!games.length&&<p role="status">Loading the latest matchups…</p>}
  <MatchupCardGrid cards={games.map((g,i)=>{
   const left=slugMap[g.home?.name],right=slugMap[g.away?.name];
   const column=matchupColumns.find(x=>x.edition==='loog'&&x.week===Number(week)&&x.teamIds.includes(String(g.home?.id||''))&&x.teamIds.includes(String(g.away?.id||'')));
   const note=matchupPairs.find(x=>(x[0]===left&&x[1]===right)||(x[0]===right&&x[1]===left))?.[2]||`WEEK ${week}`;
   return {columnHeadline:column?.headline,columnExcerpt:column?.body?.split('\n\n')[0],columnAuthor:column?writers[column.writer]?.name:null,id:g.id||i,status:isFinal?'FINAL':pregame?'PREGAME':'LIVE',href:left&&right?`/matchups/${left}/${right}`:'#scores',kicker:note,leftName:g.home?.name,leftScore:num(g.home?.score),leftProjection:num(g.home?.projection),leftImage:teamVisuals[left]?.image||'',rightName:g.away?.name,rightScore:num(g.away?.score),rightProjection:num(g.away?.projection),rightImage:teamVisuals[right]?.image||''};
  })}/>
  <MatchupEditorialColumns edition="loog" week={week} matchups={games.map(g=>({...g,href:'/matchups/'+slugMap[g.home?.name]+'/'+slugMap[g.away?.name]}))}/>
 </section>;
}
