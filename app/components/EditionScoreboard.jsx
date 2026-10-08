import MatchupCardGrid from './MatchupCardGrid';

const score=n=>n==null?'—':Number(n).toFixed(2);
const projected=n=>Number(n||0).toFixed(1);

export default function EditionScoreboard({matchups=[],week=4,rosters=[],headshots={},root='/sunday-crew',history=[]}){
  const allFinal=matchups.length>0&&matchups.every(g=>g.winner&&g.winner!=='UNDECIDED');
  const pregame=!allFinal&&matchups.length>0&&matchups.every(g=>Number(g.home?.points||0)===0&&Number(g.away?.points||0)===0);
  const rosterByKey=Object.fromEntries(rosters.map(t=>[t.teamKey,t]));
  const featured=key=>{
    const ps=rosterByKey[key]?.players||[];
    return ps.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF'&&headshots[String(p.playerId)])
      ||ps.find(p=>headshots[String(p.playerId)])||null;
  };
  const image=p=>p?.playerId?(headshots[String(p.playerId)]||''):'';
  const cards=matchups.map((g,i)=>{
    const hp=featured(g.home?.teamKey),ap=featured(g.away?.teamKey);
    return {id:g.matchupId||i,status:allFinal?'FINAL':pregame?'PREGAME':'LIVE',href:`${root}/matchups/${g.home?.teamId}/${g.away?.teamId}`,kicker:`WEEK ${week} • ${allFinal?'FINAL':pregame?'PREGAME':'OPEN MATCHUP'}`,leftName:g.home?.teamName,leftScore:score(g.home?.points),leftProjection:projected(g.home?.projectedPoints),leftImage:image(hp),rightName:g.away?.teamName,rightScore:score(g.away?.points),rightProjection:projected(g.away?.projectedPoints),rightImage:image(ap)};
  });
  return <section className="section scoreSection editionScoreSection" id="scores">
    <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week {week} {allFinal?'Final':pregame?'Matchups':'Live'}</h2></div><span>{allFinal?'FINAL SCORES • WEEK '+week+' IN THE BOOKS':pregame?'NEW WEEK • 0–0':'LATEST VERIFIED SCORES'}</span></div>
    <MatchupCardGrid cards={cards}/>
    {history.filter(w=>Number(w.matchupWeek)<Number(week)).sort((a,b)=>b.matchupWeek-a.matchupWeek).map(w=><details className="editionScoreHistory" key={w.matchupWeek}><summary>Week {w.matchupWeek} Final</summary>{w.matchups.map(g=><div className="editionHistoryGame" key={g.matchupId}><span>{g.home.teamName}</span><b>{score(g.home.points)}</b><span>{g.away.teamName}</span><b>{score(g.away.points)}</b></div>)}</details>)}
  </section>;
}
