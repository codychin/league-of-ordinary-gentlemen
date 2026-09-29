import {leagueSnapshot} from '../teams/league-data'
export default function Standings(){
 const standings=Object.values(leagueSnapshot.teams).sort((a,b)=>a.seed-b.seed)
 return <section className="section standingsWrap" id="standings"><div className="sectionhead"><div><small className="deskLabel">THE TABLE</small><h2>Standings</h2></div><span>THROUGH WEEK {leagueSnapshot.teams[Object.keys(leagueSnapshot.teams)[0]].season.completedGames}</span></div><table className="standingsTable"><thead><tr><th>#</th><th>FRANCHISE</th><th>W-L</th><th>PF</th><th>PA</th></tr></thead><tbody>{standings.map(t=><tr key={t.teamName}><td>{t.seed}</td><td>{t.teamName}</td><td>{t.record}</td><td>{Number(t.pointsFor).toFixed(2)}</td><td>{Number(t.pointsAgainst).toFixed(2)}</td></tr>)}</tbody></table></section>
}
