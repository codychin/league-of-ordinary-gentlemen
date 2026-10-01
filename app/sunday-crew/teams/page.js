import Link from 'next/link';
import {getEditionData} from '../../../lib/edition-data';

export const dynamic='force-dynamic';

export default async function SundayCrewTeams(){
  const edition=await getEditionData('sunday-crew');
  const rosters=edition?.snapshots?.rosters?.data?.data||[];
  const standings=edition?.snapshots?.standings?.data?.data?.standings||[];
  const standingById=Object.fromEntries(standings.map(t=>[String(t.teamId),t]));
  return <>
    <header className="articleHeader"><Link href="/sunday-crew" className="miniMast">The Brief of Ordinary Gentleman</Link></header>
    <main>
      <section className="directoryHead"><div className="eyebrow">SUNDAY CREW • PERSONNEL FILES</div><h1>Franchise Dossiers</h1><p>Twelve Yahoo teams. Current rosters and records. The personality files come later; the league identity does not.</p></section>
      <div className="directory">{rosters.map(r=>{const teamId=String(r.teamKey||'').split('.').pop();const st=standingById[teamId];return <Link href={'/sunday-crew/teams/'+teamId} key={r.teamKey}><div className="record">{st?(st.wins+'-'+st.losses):'—'}</div><small>{r.ownerName||'OWNER'}</small><h2>{r.teamName}</h2><div className="aliases">YAHOO TEAM {teamId}</div><p>{st?(Number(st.pointsFor).toFixed(2)+' PF • '+Number(st.pointsAgainst).toFixed(2)+' PA • $'+Number(st.faabBalance??0).toFixed(0)+' FAAB'):'Current league snapshot'}</p><span>OPEN THE FILE →</span></Link>})}</div>
    </main>
  </>;
}
