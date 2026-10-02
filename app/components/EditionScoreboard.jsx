import ResilientImage from './ResilientImage';
const score=n=>Number(n||0).toFixed(2);

export default function EditionScoreboard({matchups=[],week=4,rosters=[],headshots={}}){
  const rosterByKey=Object.fromEntries(rosters.map(t=>[t.teamKey,t]));
  const heroByTeam={
    '470.l.197826.t.1':"Ja'Marr Chase",'470.l.197826.t.5':'Jonathan Taylor',
    '470.l.197826.t.2':'Justin Jefferson','470.l.197826.t.6':'CeeDee Lamb',
    '470.l.197826.t.10':'Jaxon Smith-Njigba','470.l.197826.t.3':'Saquon Barkley',
    '470.l.197826.t.4':'James Cook III','470.l.197826.t.12':'Zay Flowers',
    '470.l.197826.t.7':'Christian McCaffrey','470.l.197826.t.9':'Jahmyr Gibbs',
    '470.l.197826.t.8':'Derrick Henry','470.l.197826.t.11':'Emeka Egbuka'
  };
  const featured=key=>{const roster=rosterByKey[key]?.players||[],preferred=heroByTeam[key];return roster.find(p=>p.name===preferred&&headshots[String(p.playerId)])||roster.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF'&&headshots[String(p.playerId)])||roster.find(p=>headshots[String(p.playerId)])||null};
  const headshot=p=>p?.playerId?(headshots[String(p.playerId)]||''):'';
  const allFinal=matchups.length>0&&matchups.every(g=>g.winner&&g.winner!=='UNDECIDED');
  return <section className="section scoreSection" id="scores">
    <div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week {week} {allFinal?'Final':'Live'}</h2></div><span>{allFinal?'FINAL SCORES • WEEK '+week+' IN THE BOOKS':'LATEST VERIFIED SCORES'}</span></div>
    <div className="scores">{matchups.map((g,i)=>{
      const hs=Number(g.home?.points||0),as=Number(g.away?.points||0),final=Boolean(g.winner&&g.winner!=='UNDECIDED');
      const awayLead=as>hs;
      const hp=featured(g.home?.teamKey),ap=featured(g.away?.teamKey);
      return <div className={'editionScoreMatch '+(final?'notable':'')} key={g.matchupId||i}>
        {final&&<small className="scoreNote">FINAL</small>}
        <div className="editionScoreRow">
          <div className="editionTeamIdentity">{hp&&<ResilientImage src={headshot(hp)} alt=""/>}<b>{g.home?.teamName}</b></div><strong>{score(hs)}</strong>
        </div>
        <div className="editionScoreRow">
          <div className="editionTeamIdentity">{ap&&<ResilientImage src={headshot(ap)} alt=""/>}<span className={awayLead?'scoreWinner':''}>{g.away?.teamName}</span></div><strong>{score(as)}</strong>
        </div>
      </div>
    })}</div>
  </section>;
}
