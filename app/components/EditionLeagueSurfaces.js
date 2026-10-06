import EditionAutopsy from './EditionAutopsy';
import SundayCrewAutopsy from './SundayCrewAutopsy';
import EditionScoreboard from './EditionScoreboard';
import SchefterTransactionFeed from './SchefterTransactionFeed';
const money=n=>Number(n??0).toFixed(0);
const pts=n=>Number(n??0).toFixed(2);

export default function EditionLeagueSurfaces({edition,headshots={},config}){
  const s=edition?.snapshots||{};
  const standings=s.standings?.data?.data?.standings||[];
  const matchups=s.matchups?.data?.data?.matchups||[];
  const transactions=s.transactions?.data?.data?.transactions||[];
  const rosters=s.rosters?.data?.data||[];
  const matchupWeek=s.matchups?.data?.data?.matchupWeek||s.matchups?.data?.data?.week||4;
  const completedWeek=Math.max(0,...standings.map(t=>Number(t.wins)+Number(t.losses)+Number(t.ties||0)));
  const teamNameByKey=Object.fromEntries(rosters.map(r=>[r.teamKey,r.teamName]));

  return <>
    {config?.autopsy?<EditionAutopsy autopsy={config.autopsy} name={config.name}/>:config?.slug==='sunday-crew'?<SundayCrewAutopsy/>:null}

    <EditionScoreboard matchups={matchups} rosters={rosters} headshots={headshots} week={matchupWeek} root={config.root} history={s.history?.data?.data?.weeks||[]}/>

    <section className="section standingsWrap" id="standings"><div className="sectionhead"><div><small className="deskLabel">THE TABLE</small><h2>Standings</h2></div><span>THROUGH WEEK {completedWeek}</span></div><table className="standingsTable"><thead><tr><th>#</th><th>FRANCHISE</th><th>W-L</th><th>PF</th><th>PA</th><th>FAAB</th></tr></thead><tbody>{standings.map(t=><tr key={t.teamKey}><td>{t.rank}</td><td>{t.name}</td><td>{t.wins}-{t.losses}</td><td>{pts(t.pointsFor)}</td><td>{pts(t.pointsAgainst)}</td><td>{'$'+money(t.faabBalance)}</td></tr>)}</tbody></table></section>

    <section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>LIVE LEAGUE ACTIVITY / VERIFIED AGAINST YAHOO</span></div><SchefterTransactionFeed transactions={transactions.filter(t=>t.status==='complete').slice(0,20).map(t=>({id:t.transaction_id,date:t.date,type:t.faab_bid!=null?'waiver':t.type,status:t.status,team:teamNameByKey[t.team_ids?.[0]]||t.team_ids?.[0]||'Unknown',add:t.players_added?.[0]?.name||'',drop:t.players_dropped?.[0]?.name||'',faab:t.faab_bid??0}))} week={null}/><div className="parodyNote">PARODY DESK • RECENT TRANSACTIONS PULLED DIRECTLY FROM YAHOO LEAGUE ACTIVITY</div></section>
  </>;
}
