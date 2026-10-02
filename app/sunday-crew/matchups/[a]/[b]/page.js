import Link from 'next/link';
import EditionSiteNav from '../../../../components/EditionSiteNav';
import {notFound} from 'next/navigation';
import {getEditionData,getNflHeadshotsByYahooId} from '../../../../../lib/edition-data';
import {writers} from '../../../../articles/writers';

export const dynamic='force-dynamic';
const fmt=n=>Number(n??0).toFixed(2).replace(/\.00$/,'');
const order={QB:0,RB:1,WR:2,TE:3,'W/R/T':4,DEF:5,K:6,BN:20,IR:30};

export default async function SundayCrewMatchup({params}){
  const {a,b}=await params;
  const [edition,headshots]=await Promise.all([getEditionData('sunday-crew'),getNflHeadshotsByYahooId()]);
  const rosters=edition?.snapshots?.rosters?.data?.data||[], standings=edition?.snapshots?.standings?.data?.data?.standings||[], games=edition?.snapshots?.matchups?.data?.data?.matchups||[];
  const left=rosters.find(r=>String(r.teamKey).endsWith('.t.'+a)),right=rosters.find(r=>String(r.teamKey).endsWith('.t.'+b));
  if(!left||!right)notFound();
  const game=games.find(g=>[String(g.home?.teamId),String(g.away?.teamId)].includes(String(a))&&[String(g.home?.teamId),String(g.away?.teamId)].includes(String(b)));
  if(!game)notFound();
  const side=(id)=>String(game.home.teamId)===String(id)?game.home:game.away;
  const ls=side(a),rs=side(b),week=Number(edition?.league?.settings?.currentWeek||4);
  const active=r=>[...(r.players||[])].filter(p=>!['BN','IR'].includes(p.selectedPosition)).sort((x,y)=>(order[x.selectedPosition]??10)-(order[y.selectedPosition]??10));
  const L=active(left),R=active(right),rows=Array.from({length:Math.max(L.length,R.length)},(_,i)=>[L[i],R[i]]);
  const standing=id=>standings.find(s=>String(s.teamId)===String(id));
  const writer=writers.gannon;
  return <>
    <header className="articleHeader"><Link href="/sunday-crew" className="miniMast">The Brief of Ordinary Gentleman</Link><EditionSiteNav root="/sunday-crew"/></header>
    <main className="matchupPage">
      <section className="matchupLead">
        <div className="matchupHeroKicker">SUNDAY CREW • WEEK {week} • GAME PREVIEW</div>
        <div className="matchupScoreboard">
          <Link href={'/sunday-crew/teams/'+a} className="matchupHeroSide"><small>{left.ownerName}</small><h1>{left.teamName}</h1><b>{fmt(ls.points)}</b><span>PROJECTED {fmt(ls.projectedPoints)}</span></Link>
          <div className="matchupHeroCenter"><span>VS</span><small>YAHOO</small></div>
          <Link href={'/sunday-crew/teams/'+b} className="matchupHeroSide right"><small>{right.ownerName}</small><h1>{right.teamName}</h1><b>{fmt(rs.points)}</b><span>PROJECTED {fmt(rs.projectedPoints)}</span></Link>
        </div>
      </section>
      <section className="matchupColumn">
        <div className="matchupColumnByline"><img src={writer.image} alt={writer.imageAlt}/><div><small>GAME PREVIEW • {writer.title.toUpperCase()}</small><b>{writer.name}</b></div></div>
        <h2>What this matchup is actually asking</h2>
        <p>{left.teamName} and {right.teamName} arrive with a {Math.abs(Number(ls.projectedPoints)-Number(rs.projectedPoints)).toFixed(1)}-point projection gap. The useful part is the roster construction, current availability and which side creates the first avoidable problem.</p>
      </section>
      <section className="matchupPrimer"><div className="matchupSectionHead"><small>THE BRIEF'S READ</small><h2>Numbers worth staring at</h2></div><div className="primerGrid">
        <article><b>{Math.abs(Number(ls.projectedPoints)-Number(rs.projectedPoints)).toFixed(1)}</b><span>PROJECTED POINT GAP</span></article>
        <article><b>{standing(a)?.wins}-{standing(a)?.losses} / {standing(b)?.wins}-{standing(b)?.losses}</b><span>RECORDS</span></article>
        <article><b>{L.filter(p=>p.status).length+R.filter(p=>p.status).length}</b><span>STARTER STATUS FLAGS</span></article>
      </div></section>
      <section className="matchupLineups"><div className="matchupSectionHead"><small>STARTING LINEUPS</small><h2>Position by position</h2></div>
        <div className="lineupRows">{rows.map(([l,r],i)=><div className="lineupRow" key={i}>
          <div>{l&&<><b>{l.selectedPosition}</b><span>{l.name}</span><strong>{fmt(l.points)}</strong></>}</div>
          <i>VS</i>
          <div>{r&&<><b>{r.selectedPosition}</b><span>{r.name}</span><strong>{fmt(r.points)}</strong></>}</div>
        </div>)}</div>
      </section>
      <Link className="back" href="/sunday-crew#scores">← ALL WEEK {week} MATCHUPS</Link>
    </main>
  </>;
}