import Link from 'next/link';
import EditionSiteNav from '../EditionSiteNav';
import {notFound} from 'next/navigation';
import {getEditionData} from '../../../lib/edition-data';

export const dynamic='force-dynamic';

const num=n=>Number(n??0).toFixed(2);
const playerSlot=p=>p.selectedPosition==='BN'?'Bench':p.selectedPosition;

export default async function Team({params,config}){
  const {root,name:editionName,slug:editionSlug,publicationName}=config;
  const {id}=await params;
  const edition=await getEditionData(editionSlug);
  const rosters=edition?.snapshots?.rosters?.data?.data||[];
  const standings=edition?.snapshots?.standings?.data?.data?.standings||[];
  const matchups=edition?.snapshots?.matchups?.data?.data?.matchups||[];
  const roster=rosters.find(r=>String(r.teamKey||'').endsWith('.t.'+id));
  const standing=standings.find(t=>String(t.teamId)===String(id));
  if(!roster) notFound();

  const week=Number(edition?.snapshots?.matchups?.data?.data?.matchupWeek||4);
  const rosterWeek=roster.snapshot?.week||week;
  const completedGames=standing?Number(standing.wins)+Number(standing.losses)+Number(standing.ties||0):0;
  const history=edition?.snapshots?.history?.data?.data?.weeks||[];
  const matchup=matchups.find(m=>String(m.home?.teamId)===String(id)||String(m.away?.teamId)===String(id));
  const isFinal=matchup?.winner&&matchup.winner!=='UNDECIDED';
  const isHome=String(matchup?.home?.teamId)===String(id);
  const mine=isHome?matchup?.home:matchup?.away;
  const opp=isHome?matchup?.away:matchup?.home;
  const rosterPlayers=[...(roster.players||[])].sort((a,b)=>{
    const reserveA=['BN','IR'].includes(a.selectedPosition)?1:0;
    const reserveB=['BN','IR'].includes(b.selectedPosition)?1:0;
    return reserveA-reserveB;
  });

  return <>
    <header className="articleHeader"><Link href={root+""} className="miniMast">{publicationName}</Link><EditionSiteNav root={root+""}/></header>
    <main className="teamPage">
      <div className="eyebrow">FRANCHISE FILE • {edition.league.season}</div>
      <h1>{roster.teamName}</h1>
      <div className="ownerLine"><b>{roster.ownerName}</b><span>YAHOO TEAM {id}</span></div>

      <div className="teamStats six">
        <div><b>{standing?(standing.wins+'-'+standing.losses):'—'}</b><span>RECORD</span></div>
        <div><b>{standing?'#'+standing.rank:'—'}</b><span>SEED</span></div>
        <div><b>{standing?num(standing.pointsFor):'—'}</b><span>PF</span></div>
        <div><b>{standing?num(Number(standing.pointsFor)/Math.max(1,completedGames)):'—'}</b><span>PPG</span></div>
        <div><b>{standing?'$'+Number(standing.faabBalance??0).toFixed(0):'—'}</b><span>FAAB</span></div>
        <div><b>{rosterPlayers.filter(p=>p.isKeeper?.kept).length}</b><span>KEEPERS</span></div>
      </div>

      <section className="seasonRead">
        <div className="operationsHead"><div><small>{edition.league.season} SEASON FILE</small><h2>Season to Date</h2></div><span>OFFICIAL YAHOO TOTALS THROUGH WEEK {completedGames}</span></div>
        <div className="seasonSummary">
          <div><b>{standing?num(standing.pointsAgainst):'—'}</b><span>POINTS AGAINST</span><small>SEASON TO DATE</small></div>
          <div><b>{standing?num(standing.pointsFor):'—'}</b><span>POINTS FOR</span><small>SEASON TO DATE</small></div>
          <div><b>{standing?'#'+standing.waiverPriority:'—'}</b><span>WAIVER PRIORITY</span><small>{standing?'$'+Number(standing.faabBalance??0).toFixed(0)+' FAAB LEFT':'—'}</small></div>
        </div>
      </section>

      {matchup&&<section className="liveOperations">
        <div className="operationsHead"><div><small>FOOTBALL OPERATIONS • WEEK {week}</small><h2>Week {week}</h2></div><span>{isFinal?'FINAL':'YAHOO MATCHUP'}</span></div>
        <div className="matchupBoard">
          <div className="matchupTeam active"><small>{roster.teamName}</small><b>{num(mine?.points)}</b><span>{isFinal?'FINAL':`PROJECTED ${num(mine?.projectedPoints)}`}</span></div>
          <div className="matchupVs">VS</div>
          <Link href={(root+"/teams/")+opp?.teamId} className="matchupTeam"><small>{opp?.teamName}</small><b>{num(opp?.points)}</b><span>{isFinal?'FINAL':`PROJECTED ${num(opp?.projectedPoints)}`}</span></Link>
        </div>
      </section>}

      <section className="seasonRead"><div className="hubHead">WEEKLY RESULTS</div>{history.map(w=>{const g=w.matchups.find(m=>String(m.home.teamId)===id||String(m.away.teamId)===id);if(!g)return null;const [me,op]=String(g.home.teamId)===id?[g.home,g.away]:[g.away,g.home];const result=Number(me.points)>Number(op.points)?'W':Number(me.points)<Number(op.points)?'L':'T';return <div className="weekResult" key={w.matchupWeek}><b className={result==='W'?'win':'loss'}>{result}</b><span>WEEK {w.matchupWeek}</span><Link href={(root+"/teams/")+op.teamId}>{op.teamName}</Link><strong>{num(me.points)}–{num(op.points)}</strong></div>})}</section>
      <section className="rosterSection">
        <div className="hubHead">LINEUP ON FILE • WEEK {rosterWeek}</div>
        <div className="rosterHeader"><span>SLOT</span><span>PLAYER</span><span>STATUS</span><span>KEEPER</span><span>WEEK {rosterWeek} PTS</span><span>COST</span></div>
        {rosterPlayers.map(p=>{const reserve=['BN','IR'].includes(p.selectedPosition);return <div className={'rosterRow '+(reserve?'reserve':'')} key={p.playerKey}>
          <b>{playerSlot(p)}</b>
          <span><strong>{p.name}</strong><em>{p.position} • {p.team}</em></span>
          <span className={p.status?'statusFlag':''}>{p.status||'—'}</span>
          <span>{p.isKeeper?.kept?'YES':'—'}</span>
          <strong data-label={'W'+week+' PTS'}>{Number(p.points||0).toFixed(1)}</strong>
          <strong data-label="KEEPER COST">{p.isKeeper?.cost?('$'+p.isKeeper.cost):'—'}</strong>
        </div>})}
      </section>

      <section className="franchiseLead">
        <div><small>EDITORIAL FILE</small><h2>{config.teamNotes?.[id]?.title||"The season on file"}</h2><p>{config.teamNotes?.[id]?.body||"The results above form this franchise’s record. Each week adds another receipt."}</p></div>
        <aside><small>ON FILE</small><p>{completedGames} games. {standing?.wins} wins. {standing?.losses} losses. {standing?num(standing.pointsFor):"—"} points scored.</p></aside>
      </section>

      <div className="teamFoot"><span>Team names change. The file does not.</span><Link href={root+"/teams"} className="back">← ALL FRANCHISES</Link></div>
    </main>
  </>;
}
