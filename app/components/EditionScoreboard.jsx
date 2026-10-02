import ResilientImage from './ResilientImage';

const score=n=>Number(n||0).toFixed(2);
const projected=n=>Number(n||0).toFixed(1);

export default function EditionScoreboard({matchups=[],week=4,rosters=[],headshots={}}){
  const allFinal=matchups.length>0&&matchups.every(g=>g.winner&&g.winner!=='UNDECIDED');
  const rosterByKey=Object.fromEntries(rosters.map(t=>[t.teamKey,t]));
  const featured=key=>{
    const ps=rosterByKey[key]?.players||[];
    return ps.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF'&&headshots[String(p.playerId)])
      ||ps.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF')
      ||ps.find(p=>headshots[String(p.playerId)])||ps[0];
  };
  const image=p=>p?.playerId?(headshots[String(p.playerId)]||''):'';
  return <section className="section editionScoreSection" id="scores">
    <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week {week} {allFinal?'Final':'Live'}</h2></div><span>{allFinal?'FINAL SCORES • WEEK '+week+' IN THE BOOKS':'LATEST VERIFIED SCORES'}</span></div>
    <div className="editionScoreGrid">{matchups.map((g,i)=>{
      const hs=Number(g.home?.points||0),as=Number(g.away?.points||0),final=Boolean(g.winner&&g.winner!=='UNDECIDED');
      const hp=featured(g.home?.teamKey),ap=featured(g.away?.teamKey),hi=image(hp),ai=image(ap);
      return <article className={'editionMatchupCard '+(final?'notable':'')} key={g.matchupId||i}>
        {final&&<small className="scoreNote">FINAL</small>}
        <div className="editionCardPortraits" aria-hidden="true">
          {hi&&<ResilientImage className="editionLeftPlayer" src={hi} alt=""/>}
          {ai&&<ResilientImage className="editionRightPlayer" src={ai} alt=""/>}
        </div>
        <div className="editionCardTeams">
          <div className="editionCardSide left"><b>{g.home?.teamName}</b><strong>{score(hs)}</strong><em>{projected(g.home?.projectedPoints)} PROJECTED</em></div>
          <i>VS</i>
          <div className="editionCardSide right"><b>{g.away?.teamName}</b><strong>{score(as)}</strong><em>{projected(g.away?.projectedPoints)} PROJECTED</em></div>
        </div>
        <div className="editionCardPlayers"><span>{hp?.name||''}</span><span>{ap?.name||''}</span></div>
      </article>
    })}</div>
  </section>;
}
