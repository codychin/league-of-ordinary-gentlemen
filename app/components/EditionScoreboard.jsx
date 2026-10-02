import Link from 'next/link';
import ResilientImage from './ResilientImage';
const score=n=>Number(n||0).toFixed(2);

export default function EditionScoreboard({matchups=[],week=4,rosters=[],headshots={},root='/sunday-crew'}){
  const rosterByKey=Object.fromEntries(rosters.map(t=>[t.teamKey,t]));
  const featured=key=>rosterByKey[key]?.players?.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF'&&headshots[String(p.playerId)])||rosterByKey[key]?.players?.find(p=>headshots[String(p.playerId)])||null;
  const headshot=p=>p?.playerId?(headshots[String(p.playerId)]||''):'';
  const allFinal=matchups.length>0&&matchups.every(g=>g.winner&&g.winner!=='UNDECIDED');
  return <section className="section scoreSection" id="scores">
    <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week {week} {allFinal?'Final':'Live'}</h2></div><span>{allFinal?'FINAL SCORES • WEEK '+week+' IN THE BOOKS':'LATEST VERIFIED SCORES'}</span></div>
    <div className="upcomingGrid editionUpcomingGrid">{matchups.map((g,i)=>{
      const hs=Number(g.home?.points||0),as=Number(g.away?.points||0);
      const hp=featured(g.home?.teamKey),ap=featured(g.away?.teamKey);
      const href=`${root}/matchups/${g.home?.teamId}/${g.away?.teamId}`;
      return <Link className="editionMatchupLink" href={href} key={g.matchupId||i}><article className="editionMatchupCard">
        <small className="editionMatchupKicker">WEEK {week} • OPEN MATCHUP</small>
        <div className="editionMatchupPortraits" aria-hidden="true">
          {hp&&<ResilientImage className="editionLeftPlayer" src={headshot(hp)} alt=""/>}
          {ap&&<ResilientImage className="editionRightPlayer" src={headshot(ap)} alt=""/>}
        </div>
        <div className="editionCardContent">
          <div className="editionCardSide left"><b>{g.home?.teamName}</b><strong>{score(hs)}</strong><em>{score(g.home?.projectedPoints)} PROJECTED</em></div>
          <i>VS</i>
          <div className="editionCardSide right"><b>{g.away?.teamName}</b><strong>{score(as)}</strong><em>{score(g.away?.projectedPoints)} PROJECTED</em></div>
        </div>
        <div className="editionMatchupPlayers"><span>{hp?.name||''}</span><span>{ap?.name||''}</span></div>
        <span className="editionMatchupOpen">OPEN MATCHUP →</span>
      </article></Link>
    })}</div>
  </section>;
}