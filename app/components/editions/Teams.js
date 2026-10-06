import Link from 'next/link';
import EditionSiteNav from '../EditionSiteNav';
import {getEditionData} from '../../../lib/edition-data';

export const dynamic='force-dynamic';

export default async function Teams({params,config}){
  const {root,name:editionName,slug:editionSlug,publicationName}=config;
  const edition=await getEditionData(editionSlug);
  const rosters=edition?.snapshots?.rosters?.data?.data||[];
  const standings=edition?.snapshots?.standings?.data?.data?.standings||[];
  const standingById=Object.fromEntries(standings.map(t=>[String(t.teamId),t]));
  return <>
    <header className="articleHeader"><Link href={root+""} className="miniMast">{publicationName}</Link><EditionSiteNav root={root+""}/></header>
    <main>
      <section className="directoryHead"><div className="eyebrow">{editionName.toUpperCase()} • PERSONNEL FILES</div><h1>Franchise Dossiers</h1><p>{rosters.length} franchises. Four weeks of receipts and counting.</p></section>
      <div className="directory">{rosters.map(r=>{const teamId=String(r.teamKey||'').split('.').pop();const st=standingById[teamId];return <Link href={(root+"/teams/")+teamId} key={r.teamKey}><div className="record">{st?(st.wins+'-'+st.losses):'—'}</div><small>{r.ownerName||'OWNER'}</small><h2>{r.teamName}</h2><div className="aliases">YAHOO TEAM {teamId}</div><p>{st?(Number(st.pointsFor).toFixed(2)+' PF • '+Number(st.pointsAgainst).toFixed(2)+' PA • $'+Number(st.faabBalance??0).toFixed(0)+' FAAB'):'Current league snapshot'}</p><span>OPEN THE FILE →</span></Link>})}</div>
    </main>
  </>;
}
