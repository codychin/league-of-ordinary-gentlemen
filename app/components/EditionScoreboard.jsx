import ResilientImage from './ResilientImage';
const score=n=>Number(n||0).toFixed(2);

export default function EditionScoreboard({matchups=[],week=4,rosters=[],headshots={}}){
  const rosterByKey=Object.fromEntries(rosters.map(t=>[t.teamKey,t]));
  const featured=key=>rosterByKey[key]?.players?.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF'&&headshots[String(p.playerId)])||rosterByKey[key]?.players?.find(p=>headshots[String(p.playerId)])||null;
  const headshot=p=>p?.playerId?(headshots[String(p.playerId)]||''):'';
  const allFinal=matchups.length>0&&matchups.every(g=>g.winner&&g.winner!=='UNDECIDED');
  return <section className="section scoreSection" id="scores">
    <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week {week} {allFinal?'Final':'Live'}</h2></div><span>{allFinal?'FINAL SCORES • WEEK '+week+' IN THE BOOKS':'LATEST VERIFIED SCORES'}</span></div>
    <div className="scores">{matchups.map((g,i)=>{
      const hs=Number(g.home?.points||0),as=Number(g.away?.points||0),final=Boolean(g.winner&&g.winner!=='UNDECIDED');
      const awayLead=as>hs;
      const hp=featured(g.home?.teamKey),ap=featured(g.away?.teamKey);
      return <div className={'editionScoreMatch '+(final?'notable':'')} key={g.matchupId||i}>
        <div className="editionMatchupPortraits" aria-hidden="true">{hp&&<ResilientImage src={headshot(hp)} alt=""/>}{ap&&<ResilientImage src={headshot(ap)} alt=""/>}</div>
        {final&&<small className="scoreNote">FINAL</small>}
        <div className="editionScoreRow"><b>{g.home?.teamName}</b><strong>{score(hs)}</strong></div>
        <div className="editionScoreRow"><span className={awayLead?'scoreWinner':''}>{g.away?.teamName}</span><strong>{score(as)}</strong></div>
      </div>
    })}</div>
  </section>;
}
