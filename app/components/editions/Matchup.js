import Link from 'next/link';
import EditionSiteNav from '../EditionSiteNav';
import {notFound} from 'next/navigation';
import {getEditionData,getNflHeadshotsByYahooId} from '../../../lib/edition-data';
import {writers} from '../../articles/writers';

export const dynamic='force-dynamic';
const fmt=n=>Number(n??0).toFixed(2).replace(/\.00$/,'');
const order={QB:0,RB:1,WR:2,TE:3,'W/R/T':4,DEF:5,K:6,BN:20,IR:30};

export default async function Matchup({params,config}){
  const {root,name:editionName,slug:editionSlug,publicationName}=config;
  const {a,b}=await params;
  const [edition,headshots]=await Promise.all([getEditionData(editionSlug),getNflHeadshotsByYahooId()]);
  const rosters=edition?.snapshots?.rosters?.data?.data||[], standings=edition?.snapshots?.standings?.data?.data?.standings||[], games=edition?.snapshots?.matchups?.data?.data?.matchups||[];
  const left=rosters.find(r=>String(r.teamKey).endsWith('.t.'+a)),right=rosters.find(r=>String(r.teamKey).endsWith('.t.'+b));
  if(!left||!right)notFound();
  const game=games.find(g=>[String(g.home?.teamId),String(g.away?.teamId)].includes(String(a))&&[String(g.home?.teamId),String(g.away?.teamId)].includes(String(b)));
  if(!game)notFound();
  const side=(id)=>String(game.home.teamId)===String(id)?game.home:game.away;
  const ls=side(a),rs=side(b),week=Number(edition?.snapshots?.matchups?.data?.data?.matchupWeek||4);
  const active=r=>[...(r.players||[])].filter(p=>!['BN','IR'].includes(p.selectedPosition)).sort((x,y)=>(order[x.selectedPosition]??10)-(order[y.selectedPosition]??10));
  const L=active(left),R=active(right),rows=Array.from({length:Math.max(L.length,R.length)},(_,i)=>[L[i],R[i]]);
  const standing=id=>standings.find(s=>String(s.teamId)===String(id));
  const writer=writers.gannon;
  const isFinal=game.winner&&game.winner!=='UNDECIDED';
  return <>
    <header className="articleHeader"><Link href={root+""} className="miniMast">{publicationName}</Link><EditionSiteNav root={root+""}/></header>
    <main className="matchupPage">
      <section className="matchupLead">
        <div className="matchupHeroKicker">{editionName.toUpperCase()} • WEEK {week} • {isFinal?"FINAL RESULT":"LATEST SCORE"}</div>
        <div className="matchupScoreboard">
          <Link href={(root+"/teams/")+a} className="matchupHeroSide"><small>{left.ownerName}</small><h1>{left.teamName}</h1><b>{fmt(ls.points)}</b><span>{isFinal?"FINAL":"IN PROGRESS"}</span></Link>
          <div className="matchupHeroCenter"><span>VS</span><small>YAHOO</small></div>
          <Link href={(root+"/teams/")+b} className="matchupHeroSide right"><small>{right.ownerName}</small><h1>{right.teamName}</h1><b>{fmt(rs.points)}</b><span>{isFinal?"FINAL":"IN PROGRESS"}</span></Link>
        </div>
      </section>
      <section className="matchupColumn">
        <div className="matchupColumnByline"><img src={writer.image} alt={writer.imageAlt}/><div><small>{isFinal?"FINAL RESULT":"MATCHUP IN PROGRESS"} • {writer.title.toUpperCase()}</small><b>{writer.name}</b></div></div>
        <h2>{isFinal?"The final accounting":"The score so far"}</h2>
        <p>{!isFinal?"The matchup is still in progress. Scores below are the latest verified totals.":<>{left.teamName} and {right.teamName} finished with a {Math.abs(Number(ls.points)-Number(rs.points)).toFixed(2)}-point margin. {Number(ls.points)>Number(rs.points)?left.teamName:right.teamName} takes the win. The lineup below is the Week {week} record, with actual player points.</>}</p>
      </section>
      <section className="matchupPrimer"><div className="matchupSectionHead"><small>THE BRIEF'S READ</small><h2>Numbers worth staring at</h2></div><div className="primerGrid">
        <article><b>{Math.abs(Number(ls.points)-Number(rs.points)).toFixed(2)}</b><span>{isFinal?"FINAL MARGIN":"CURRENT MARGIN"}</span></article>
        <article><b>{standing(a)?.wins}-{standing(a)?.losses} / {standing(b)?.wins}-{standing(b)?.losses}</b><span>RECORDS</span></article>
        <article><b>{L.filter(p=>p.status).length+R.filter(p=>p.status).length}</b><span>STARTER STATUS FLAGS</span></article>
      </div></section>
      <section className="lineupPreview">
        <div className="matchupSectionHead"><div><small>STARTING LINEUPS</small><h2>Position by position</h2></div></div>
        <div className="lineupTeams"><span>{left.teamName}</span><span>{right.teamName}</span></div>
        <div>{rows.map(([l,r],i)=><div className="lineupRow" key={i}>
          <div className="lineupPlayer left">{l&&<><small>{l.selectedPosition}</small><b>{l.name}</b><span>{fmt(l.points)}</span>{l.status&&<em>{l.status}</em>}</>}</div>
          <div className="lineupVs">VS</div>
          <div className="lineupPlayer right">{r&&<><small>{r.selectedPosition}</small><b>{r.name}</b><span>{fmt(r.points)}</span>{r.status&&<em>{r.status}</em>}</>}</div>
        </div>)}</div>
      </section>
      <Link className="matchupBack" href={root+"#scores"}>← ALL WEEK {week} MATCHUPS</Link>
    </main>
  </>;
}