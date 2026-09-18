import Link from 'next/link'
import {teams} from '../data'
import SiteNav from '../../components/SiteNav'

export default async function Team({params}) {
  const {id}=await params
  const t=teams.find(x=>x.id===id)
  if(!t) return <main>Team not found.</main>

  return <>
    <header className="articleHeader"><Link href="/" className="miniMast">The Brief of Ordinary Gentleman</Link><SiteNav/></header>
    <main className="teamPage">
      <div className="eyebrow">FRANCHISE FILE • 2026</div>
      <h1>{t.team}</h1>
      <div className="ownerLine"><b>{t.owners}</b><span>{t.aliases}</span></div>
      <div className="teamStats four"><div><b>{t.record}</b><span>RECORD</span></div><div><b>{t.pf}</b><span>PF</span></div><div><b>{t.pa}</b><span>PA</span></div><div><b>W1</b><span>THROUGH</span></div></div>

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

      <div className="hubGrid"><section><div className="hubHead">WEEK 1 / LEADING RETURNS</div>{t.stars.map((x,i)=><div className="ledgerRow" key={i}><b>{String(i+1).padStart(2,'0')}</b><span>{x}</span></div>)}</section><section><div className="hubHead">TRANSACTION DESK</div>{t.moves.length?t.moves.map((x,i)=><div className="ledgerRow" key={i}><b>→</b><span>{x}</span></div>):<p className="quiet">No material Week 2 activity on file.</p>}</section></div>
      <section className="mythology"><div className="hubHead">FRANCHISE MYTHOLOGY</div><div className="mythGrid">{t.mythology.map((x,i)=>{const [head,...rest]=x.split(' — ');return <article key={i}><small>FILE {String(i+1).padStart(2,'0')}</small><h3>{head}</h3><p>{rest.join(' — ')}</p></article>})}</div></section>
      <section className="coverage"><div className="hubHead">RECENT COVERAGE</div>{t.coverage.length?t.coverage.map(([slug,title])=><Link href={`/articles/${slug}`} key={slug}><span>THE BRIEF</span><b>{title}</b><em>READ →</em></Link>):<p className="quiet">No dedicated coverage yet. This should not be interpreted as institutional approval.</p>}</section>
      <div className="teamFoot"><span>Team names change. The file does not.</span><Link href="/teams" className="back">← ALL FRANCHISES</Link></div>
    </main>
  </>
}
