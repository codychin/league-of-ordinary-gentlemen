import Link from 'next/link'
import {teams} from '../data'
import {leagueSnapshot} from '../league-data'
import SiteNav from '../../components/SiteNav'

export default async function Team({params}) {
  const {id}=await params
  const t=teams.find(x=>x.id===id)
  if(!t) return <main>Team not found.</main>
  const ops=leagueSnapshot.teams[id]
  const maxPositionPoints=Math.max(...Object.values(ops.season.positionTotals),1)

  return <>
    <header className="articleHeader"><Link href="/" className="miniMast">The Brief of Ordinary Gentleman</Link><SiteNav/></header>
    <main className="teamPage">
      <div className="eyebrow">FRANCHISE FILE • 2026</div>
      <h1>{t.team}</h1>
      <div className="ownerLine"><b>{t.owners}</b><span>{t.aliases}</span></div>
      <div className="teamStats six"><div><b>{ops.record}</b><span>RECORD</span></div><div><b>#{ops.seed}</b><span>SEED</span></div><div><b>{ops.pointsFor}</b><span>PF</span></div><div><b>{ops.season.ppg}</b><span>PPG</span></div><div><b>#{ops.season.pfRank}</b><span>PF RANK</span></div><div><b>#{ops.season.projectedRank}</b><span>ESPN PROJ.</span></div></div>

      <section className="seasonRead">
        <div className="operationsHead"><div><small>2026 SEASON FILE</small><h2>Season to Date</h2></div><span>OFFICIAL TOTALS THROUGH WEEK {ops.season.completedGames} • LIVE WEEK {leagueSnapshot.week} SHOWN BELOW</span></div>
        <div className="seasonSummary">
          <div><b>{ops.pointsAgainst}</b><span>POINTS AGAINST</span><small>#{ops.season.paRank} MOST</small></div>
          <div><b>{ops.season.startedPoints}</b><span>STARTER POINTS</span><small>INCLUDING LIVE WEEK {leagueSnapshot.week}</small></div>
          <div><b>{ops.season.benchPoints}</b><span>BENCH POINTS</span><small>SEASON TO DATE</small></div>
        </div>
        <div className="seasonDetailGrid">
          <div><div className="hubHead">WEEKLY RESULTS</div>{ops.season.weekly.map(w=><div className="weekResult" key={w.week}><b className={w.result==='W'?'win':w.result==='L'?'loss':'live'}>{w.result==='—'?'LIVE':w.result}</b><span>WEEK {w.week}</span><Link href={`/teams/${w.opponentSlug}`}>{w.opponent}</Link><strong>{w.score}–{w.opponentScore}</strong></div>)}</div>
          <div><div className="hubHead">STARTER PRODUCTION BY SLOT</div>{Object.entries(ops.season.positionTotals).map(([slot,points])=><div className="positionStat" key={slot}><b>{slot}</b><div><i style={{width:`${Math.max(3,(points/maxPositionPoints)*100)}%`}}/></div><strong>{points}</strong></div>)}</div>
        </div>
      </section>

      <section className="liveOperations">
        <div className="operationsHead"><div><small>FOOTBALL OPERATIONS • LIVE SNAPSHOT</small><h2>Week {leagueSnapshot.week}</h2></div><span>{leagueSnapshot.updatedAt}</span></div>
        <div className="matchupBoard">
          <div className="matchupTeam active"><small>{t.team}</small><b>{ops.matchup.score}</b><span>PROJECTED {ops.matchup.projection}</span></div>
          <div className="matchupVs">VS</div>
          <Link href={`/teams/${ops.matchup.opponentSlug}`} className="matchupTeam"><small>{ops.matchup.opponent}</small><b>{ops.matchup.opponentScore}</b><span>PROJECTED {ops.matchup.opponentProjection}</span></Link>
        </div>
      </section>

      <section className="rosterSection">
        <div className="hubHead">ACTIVE ROSTER • WEEK {leagueSnapshot.week}</div>
        <div className="rosterHeader"><span>SLOT</span><span>PLAYER</span><span>STATUS</span><span>STARTS</span><span>WEEK {leagueSnapshot.week} PTS</span><span>SEASON PTS</span></div>
        {ops.roster.map((p,i)=>{const reserve=p.slot==='Bench'||p.slot==='IR';return <div className={`rosterRow ${reserve?'reserve':''}`} key={p.id}><b>{p.slot}</b><span><strong>{p.name}</strong><em>{p.position} • {p.team}</em></span><span className={p.status?'statusFlag':''}>{p.status||'—'}</span><span>{p.starts}</span><strong data-label={`W${leagueSnapshot.week} PTS`}>{Number(p.weekPoints).toFixed(1)}</strong><strong data-label="SEASON PTS">{Number(p.seasonPoints).toFixed(1)}</strong></div>})}
      </section>

      <section className="franchiseLead"><div><small>WEEK 1</small><h2>{t.week1}</h2><p>{t.note}</p></div><aside><small>ON FILE</small><p>{t.lore}</p></aside></section>

      <section className="personnel">
        <div className="hubHead">UNAUTHORIZED BIOGRAPHY</div>
        <p className="fileDisclaimer">Compiled from league records, disputed testimony and messages presented without context.</p>
        <div className={`personGrid ${t.people.length===1?'single':''}`}>{t.people.map((person,i)=><article className="personCard" key={person.name}>
          <small>PERSONNEL {String(i+1).padStart(2,'0')}</small>
          <h2>{person.name}</h2>
          <div className="personTitle">{person.title}</div>
          <div className="personAliases">KNOWN AS: {person.aliases}</div>
          <p>{person.bio}</p>
        </article>)}</div>
      </section>

      {t.associates?.length>0&&<section className="associates"><div className="hubHead">KNOWN ASSOCIATES</div>{t.associates.map(a=><article key={a.name}><div><small>UNREGISTERED PERSONNEL</small><h3>{a.name}</h3><b>{a.title}</b></div><p>{a.note}</p></article>)}</section>}

      <section className="institutionalFile">
        <div className="posture"><small>CURRENT INSTITUTIONAL POSTURE</small><b>{t.posture}</b></div>
        <div><div className="hubHead">INSTITUTIONAL TENDENCIES</div>{t.tendencies.map((x,i)=><div className="ledgerRow" key={x}><b>{String(i+1).padStart(2,'0')}</b><span>{x}</span></div>)}</div>
        <div><div className="hubHead">CAREER INCIDENTS</div>{t.incidents.map(x=><div className="incident" key={x}>{x}</div>)}</div>
      </section>

      <aside className="dossierReceipt"><small>THE RECEIPTS</small><b>{t.receipt}</b><span>Filed permanently. Revisit at your own risk.</span></aside>

      <div className="hubGrid"><section><div className="hubHead">WEEK 1 / LEADING RETURNS</div>{t.stars.map((x,i)=><div className="ledgerRow" key={i}><b>{String(i+1).padStart(2,'0')}</b><span>{x}</span></div>)}</section><section><div className="hubHead">RECENT TRANSACTIONS</div>{ops.moves.length?ops.moves.map((x,i)=><div className="transactionRow" key={`${x.date}-${i}`}><small>{x.date}</small><b>{x.label}</b><span>{x.detail}</span></div>):<p className="quiet">No recent transaction activity on file.</p>}</section></div>
      <section className="mythology"><div className="hubHead">FRANCHISE MYTHOLOGY</div><div className="mythGrid">{t.mythology.map((x,i)=>{const [head,...rest]=x.split(' — ');return <article key={i}><small>FILE {String(i+1).padStart(2,'0')}</small><h3>{head}</h3><p>{rest.join(' — ')}</p></article>})}</div></section>
      <section className="coverage"><div className="hubHead">RECENT COVERAGE</div>{t.coverage.length?t.coverage.map(([slug,title])=><Link href={`/articles/${slug}`} key={slug}><span>THE BRIEF</span><b>{title}</b><em>READ →</em></Link>):<p className="quiet">No dedicated coverage yet. This should not be interpreted as institutional approval.</p>}</section>
      <div className="teamFoot"><span>Team names change. The file does not.</span><Link href="/teams" className="back">← ALL FRANCHISES</Link></div>
    </main>
  </>
}
