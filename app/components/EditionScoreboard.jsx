const score=n=>Number(n||0).toFixed(2);

export default function EditionScoreboard({matchups=[],week=4}){
  const allFinal=matchups.length>0&&matchups.every(g=>g.winner&&g.winner!=='UNDECIDED');
  return <section className="section scoreSection" id="scores">
    <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week {week} {allFinal?'Final':'Live'}</h2></div><span>{allFinal?'FINAL SCORES • WEEK '+week+' IN THE BOOKS':'LATEST VERIFIED SCORES'}</span></div>
    <div className="scores">{matchups.map((g,i)=>{
      const hs=Number(g.home?.points||0),as=Number(g.away?.points||0),final=Boolean(g.winner&&g.winner!=='UNDECIDED');
      const awayLead=as>hs;
      return <div className={'match '+(final?'notable':'')} key={g.matchupId||i}>
        {final&&<small className="scoreNote">FINAL</small>}
        <div><b>{g.home?.teamName}</b><strong>{score(hs)}</strong></div>
        <div><span className={awayLead?'scoreWinner':''}>{g.away?.teamName}</span><strong>{score(as)}</strong></div>
      </div>
    })}</div>
  </section>;
}
