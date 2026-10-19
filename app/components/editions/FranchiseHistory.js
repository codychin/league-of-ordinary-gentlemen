import Link from 'next/link';
import archive from '../../../data/sunday-crew-franchise-history.json';
import styles from './FranchiseHistory.module.css';

export default function FranchiseHistory({teamId,editionSlug}){
  if(editionSlug!=='sunday-crew')return null;
  const file=archive.teams[String(teamId)];
  if(!file)return null;
  return <section className={styles.history} aria-labelledby="franchise-history-title" id="franchise-history">
    <div className={styles.flag}><span>THE FRANCHISE HISTORY</span><span>{file.period} ARCHIVE</span></div>
    <header className={styles.heading}>
      <div className={styles.manager}>{file.manager} · Sunday Crew</div>
      <h2 id="franchise-history-title">{file.title}</h2>
      <p>{file.dek}</p>
    </header>
    <dl className={styles.stats}>
      <div><dt>REGULAR SEASON</dt><dd>{file.record}</dd></div>
      <div><dt>CHAMPIONSHIPS</dt><dd>{file.titles.length}</dd></div>
      <div><dt>PLAYOFF APPEARANCES</dt><dd>{file.playoffs}</dd></div>
      <div><dt>SEASONS ON FILE</dt><dd>{file.seasons.length}</dd></div>
    </dl>
    <p className={styles.scope}>Historical totals through 2025. Current-season results appear below.</p>
    <div className={styles.columns}>
      <div className={styles.story}>{file.sections.map(([heading,body])=><div key={heading}><h3>{heading}</h3><p>{body}</p></div>)}</div>
      <aside className={styles.rivals} aria-label="Franchise rivalries">
        <h3>Familiar opposition</h3>
        {file.rivals.map(([id,name,detail])=><Link key={id} href={'/sunday-crew/teams/'+id}><strong>{name}</strong><span>{detail}</span><small>OPEN THEIR HISTORY ↗</small></Link>)}
        <p>Head-to-head figures are the archive’s recorded series through 2025.</p>
      </aside>
    </div>
    <div className={styles.seasonHeading}><h3>Every season on file</h3><span>{file.manager}</span></div>
    <div className={styles.tableWrap} role="region" aria-label="Historical season results" tabIndex={0}>
      <table><caption>Regular-season records and final finishes · {file.period}</caption><thead><tr><th scope="col">Season</th><th scope="col">Name on the door</th><th scope="col">Record</th><th scope="col">Finish</th></tr></thead><tbody>
        {file.seasons.map(s=><tr key={s.year} className={s.finish==='Champion'?styles.champion:undefined}><th scope="row">{s.year}</th><td>{s.name}</td><td>{s.record}</td><td>{s.finish}</td></tr>)}
      </tbody></table>
    </div>
    <p className={styles.source}>Source: the league’s uploaded League Legacy histories, through 2025, with Sunday Crew lore. Records follow the manager across team-name changes.</p>
  </section>;
}
