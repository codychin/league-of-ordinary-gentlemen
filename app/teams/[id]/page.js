import Link from 'next/link'
import {teams} from '../data'
import {leagueSnapshot} from '../league-data'
import SiteNav from '../../components/SiteNav'

export default async function Team({params}) {
  const {id}=await params
  const t=teams.find(x=>x.id===id)
  if(!t) return <main>Team not found.</main>
  const ops=leagueSnapshot.teams[id]

  return <>
    <header className="articleHeader"><Link href="/" className="miniMast">The Brief of Ordinary Gentleman</Link><SiteNav/></header>
    <main className="teamPage">
      <div className="eyebrow">FRANCHISE FILE • 2026</div>
      <h1>{t.team}</h1>
      <div className="ownerLine"><b>{t.owners}</b><span>{t.aliases}</span></div>
      <div className="teamStats six"><div><b>{ops.record}</b><span>RECORD</span></div><div><b>#{ops.seed}</b><span>SEED</span></div><div><b>{ops.pointsFor}</b><span>PF</span></div><div><b>{ops.pointsAgainst}</b><span>PA</span></div><div><b>#{ops.projectedRank}</b><span>ESPN PROJ.</span></div><div><b>W{leagueSnapshot.week}</b><span>THROUGH</span></div></div>

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
        <div className="rosterHeader"><span>SLOT</span><span>PLAYER</span><span>NFL</span><span>STATUS</span><span>PTS</span></div>
        {ops.roster.map((p,i)=>{const reserve=p.slot==='Bench'||p.slot==='IR';return <div className={`rosterRow ${reserve?'reserve':''}`} key={p.id}><b>{p.slot}</b><span><strong>{p.name}</strong><em>{p.position}</em></span><span>{p.team}</span><span className={p.status?'statusFlag':''}>{p.status||'—'}</span><strong>{Number(p.weekPoints).toFixed(1)}</strong></div>})}
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
