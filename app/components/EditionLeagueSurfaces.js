import EditionScoreboard from './EditionScoreboard';
import SchefterTransactionFeed from './SchefterTransactionFeed';
const money=n=>Number(n??0).toFixed(0);
const pts=n=>Number(n??0).toFixed(2);

export default function EditionLeagueSurfaces({edition}){
  const s=edition?.snapshots||{};
  const standings=s.standings?.data?.data?.standings||[];
  const matchups=s.matchups?.data?.data?.matchups||[];
  const transactions=s.transactions?.data?.data?.transactions||[];
  const rosters=s.rosters?.data?.data||[];
  const teamNameByKey=Object.fromEntries(rosters.map(r=>[r.teamKey,r.teamName]));
  const leader=standings[0];
  const pointsLeader=[...standings].sort((a,b)=>Number(b.pointsFor)-Number(a.pointsFor))[0];
  const userTeam=standings.find(t=>t.teamId==='10');

  return <>
    <section className="section autopsySection" id="league">
      <div className="autopsyHeader">
        <div><small>THE NEWSROOM • SUNDAY CREW ARCHIVE</small><h2>Week 3 Autopsy</h2></div>
        <span>BACKFILL IN PROGRESS</span>
      </div>
      <div className="autopsyLead">
        <h3>The archive stops before the newsroom arrived.</h3>
        <p>Sunday Crew’s Yahoo record is connected and current, but we have not reconstructed a Week 3 editorial autopsy yet. Until we do, this edition will leave the space explicit rather than substitute reporting from another league.</p>
        <strong>NO CROSS-LEAGUE FILLER</strong>
      </div>
    </section>

    <EditionScoreboard matchups={matchups} week={edition.league?.settings?.currentWeek||4}/>

    <section className="section standingsWrap" id="standings"><div className="sectionhead"><div><small className="deskLabel">THE TABLE</small><h2>Standings</h2></div><span>THROUGH WEEK 3</span></div><table className="standingsTable"><thead><tr><th>#</th><th>FRANCHISE</th><th>W-L</th><th>PF</th><th>PA</th><th>FAAB</th></tr></thead><tbody>{standings.map(t=><tr key={t.teamKey}><td>{t.rank}</td><td>{t.name}</td><td>{t.wins}-{t.losses}</td><td>{pts(t.pointsFor)}</td><td>{pts(t.pointsAgainst)}</td><td>{'$'+money(t.faabBalance)}</td></tr>)}</tbody></table></section>

    <section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>LIVE LEAGUE ACTIVITY / VERIFIED AGAINST YAHOO</span></div><SchefterTransactionFeed transactions={transactions.slice(0,20).map(t=>({id:t.transaction_id,date:t.date,type:t.faab_bid!=null?'waiver':t.type,status:t.status,team:teamNameByKey[t.team_ids?.[0]]||t.team_ids?.[0]||'Unknown',add:t.players_added?.[0]?.name||'',drop:t.players_dropped?.[0]?.name||'',faab:t.faab_bid??0}))} week={edition.league?.settings?.currentWeek||4}/><div className="parodyNote">PARODY DESK • CURRENT-WEEK TRANSACTIONS PULLED DIRECTLY FROM YAHOO LEAGUE ACTIVITY</div></section>
  </>;
}
