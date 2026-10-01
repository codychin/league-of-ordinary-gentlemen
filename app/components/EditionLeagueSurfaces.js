const money=n=>Number(n??0).toFixed(0);
const pts=n=>Number(n??0).toFixed(2);

export default function EditionLeagueSurfaces({edition}){
  const s=edition?.snapshots||{};
  const standings=s.standings?.data?.data?.standings||[];
  const matchups=s.matchups?.data?.data?.matchups||[];
  const transactions=s.transactions?.data?.data?.transactions||[];
  const rosters=s.rosters?.data?.data||[];
  const teamNameByKey=Object.fromEntries(rosters.map(r=>[r.teamKey,r.teamName]));
  const successful=transactions.filter(t=>t.status==='complete').slice(0,12);
  const leader=standings[0];
  const pointsLeader=[...standings].sort((a,b)=>Number(b.pointsFor)-Number(a.pointsFor))[0];
  const userTeam=standings.find(t=>t.teamId==='10');

  return <>
    <section className="section" id="league">
      <div className="sectionhead"><div><small className="deskLabel">THE LOCAL BUREAU</small><h2>Sunday Crew</h2></div><span>YAHOO • WEEK {edition.league?.settings?.currentWeek||4} • LIVE TENANT</span></div>
      <div className="grid3">
        <article className="card"><div className="tag">TABLE LEADER</div><h3>{leader?.name||'—'}</h3><p>{leader?(leader.wins+'-'+leader.losses+' with '+pts(leader.pointsFor)+' points for.'):'Standings unavailable.'}</p></article>
        <article className="card"><div className="tag">POINTS LEADER</div><h3>{pointsLeader?.name||'—'}</h3><p>{pointsLeader?(pts(pointsLeader.pointsFor)+' points despite a '+pointsLeader.wins+'-'+pointsLeader.losses+' record.'):'Points unavailable.'}</p></article>
        <article className="card"><div className="tag">CHANE GANG</div><h3>{userTeam?(userTeam.wins+'-'+userTeam.losses):'—'}</h3><p>{userTeam?(pts(userTeam.pointsFor)+' PF • '+pts(userTeam.pointsAgainst)+' PA • $'+money(userTeam.faabBalance)+' FAAB remaining.'):'Team state unavailable.'}</p></article>
      </div>
    </section>

    <section className="section scoreSection" id="scores"><div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week 4</h2></div><span>CURRENT YAHOO MATCHUPS</span></div><div className="scores">{matchups.map(m=><div className="match" key={m.matchupId}><div><b>{m.home?.teamName}</b><strong>{pts(m.home?.points)}</strong></div><div><span>{m.away?.teamName}</span><strong>{pts(m.away?.points)}</strong></div><small className="scoreNote">PROJ {pts(m.home?.projectedPoints)}–{pts(m.away?.projectedPoints)}</small></div>)}</div></section>

    <section className="section standingsWrap" id="standings"><div className="sectionhead"><div><small className="deskLabel">THE TABLE</small><h2>Standings</h2></div><span>THROUGH WEEK 3</span></div><table className="standingsTable"><thead><tr><th>#</th><th>FRANCHISE</th><th>W-L</th><th>PF</th><th>PA</th><th>FAAB</th></tr></thead><tbody>{standings.map(t=><tr key={t.teamKey}><td>{t.rank}</td><td>{t.name}</td><td>{t.wins}-{t.losses}</td><td>{pts(t.pointsFor)}</td><td>{pts(t.pointsAgainst)}</td><td>{'$'+money(t.faabBalance)}</td></tr>)}</tbody></table></section>

    <section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>SUCCESSFUL MOVES • YAHOO VERIFIED</span></div><div className="schefterFeed">{successful.map(t=>{const team=teamNameByKey[t.team_ids?.[0]]||t.team_ids?.[0]||'Unknown';const add=t.players_added?.[0]?.name;const drop=t.players_dropped?.[0]?.name;return <article className="schefterPost" key={t.transaction_id}><div className="schefterBody"><div className="schefterMeta"><b>{team}</b><span> · {t.date}</span><i>•••</i></div><p>{add?('Added '+add):'Roster move'}{drop?(', released '+drop):''}{t.faab_bid!=null?(' for $'+t.faab_bid+' FAAB'):''}.</p><div className="schefterEngagement"><span>VERIFIED</span><span>{String(t.type).toUpperCase()}</span></div></div></article>})}</div></section>
  </>;
}
