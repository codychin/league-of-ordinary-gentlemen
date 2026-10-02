import MatchupCardGrid from './MatchupCardGrid';

const score=n=>Number(n||0).toFixed(2);
const projected=n=>Number(n||0).toFixed(1);

export default function EditionScoreboard({matchups=[],week=4,rosters=[],headshots={},root='/sunday-crew'}){
  const allFinal=matchups.length>0&&matchups.every(g=>g.winner&&g.winner!=='UNDECIDED');
  const rosterByKey=Object.fromEntries(rosters.map(t=>[t.teamKey,t]));
  const featured=key=>{
    const ps=rosterByKey[key]?.players||[];
    return ps.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF'&&headshots[String(p.playerId)])
      ||ps.find(p=>headshots[String(p.playerId)])||null;
  };
  const image=p=>p?.playerId?(headshots[String(p.playerId)]||''):'';
  const cards=matchups.map((g,i)=>{
    const hp=featured(g.home?.teamKey),ap=featured(g.away?.teamKey);
    return {id:g.matchupId||i,href:`${root}/matchups/${g.home?.teamId}/${g.away?.teamId}`,kicker:`WEEK ${week} • OPEN MATCHUP`,leftName:g.home?.teamName,leftScore:score(g.home?.points),leftProjection:projected(g.home?.projectedPoints),leftImage:image(hp),rightName:g.away?.teamName,rightScore:score(g.away?.points),rightProjection:projected(g.away?.projectedPoints),rightImage:image(ap)};
  });
  return <section className="section scoreSection editionScoreSection" id="scores">
    <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week {week} {allFinal?'Final':'Live'}</h2></div><span>{allFinal?'FINAL SCORES • WEEK '+week+' IN THE BOOKS':'LATEST VERIFIED SCORES'}</span></div>
    <MatchupCardGrid cards={cards}/>
  </section>;
}
