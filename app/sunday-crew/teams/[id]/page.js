import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getEditionData} from '../../../../lib/edition-data';

export const dynamic='force-dynamic';

export default async function SundayCrewTeam({params}){
  const {id}=await params;
  const edition=await getEditionData('sunday-crew');
  const rosters=edition?.snapshots?.rosters?.data?.data||[];
  const standings=edition?.snapshots?.standings?.data?.data?.standings||[];
  const roster=rosters.find(r=>String(r.teamKey||'').endsWith('.t.'+id));
  const standing=standings.find(t=>String(t.teamId)===String(id));
  if(!roster) notFound();
  const starters=(roster.players||[]).filter(p=>!['BN','IR'].includes(p.selectedPosition));
  const bench=(roster.players||[]).filter(p=>['BN','IR'].includes(p.selectedPosition));
  return <>
    <header className="articleHeader"><Link href="/sunday-crew" className="miniMast">The Brief of Ordinary Gentleman</Link></header>
    <main>
      <section className="directoryHead"><div className="eyebrow">SUNDAY CREW • FRANCHISE DOSSIER</div><h1>{roster.teamName}</h1><p>{roster.ownerName} • {standing?(standing.wins+'-'+standing.losses+' • '+Number(standing.pointsFor).toFixed(2)+' PF'):'Current Yahoo roster'}</p></section>
      <section className="section standingsWrap"><div className="sectionhead"><div><small className="deskLabel">ACTIVE ROSTER</small><h2>Lineup</h2></div><span>{(roster.players||[]).length} PLAYERS</span></div><table className="standingsTable"><thead><tr><th>SLOT</th><th>PLAYER</th><th>POS</th><th>NFL</th><th>STATUS</th></tr></thead><tbody>{starters.map(p=><tr key={p.playerKey}><td>{p.selectedPosition}</td><td>{p.name}</td><td>{p.position}</td><td>{p.team}</td><td>{p.status||'—'}</td></tr>)}</tbody></table></section>
      <section className="section standingsWrap"><div className="sectionhead"><div><small className="deskLabel">DEPTH</small><h2>Bench / Reserve</h2></div></div><table className="standingsTable"><thead><tr><th>SLOT</th><th>PLAYER</th><th>POS</th><th>NFL</th><th>STATUS</th></tr></thead><tbody>{bench.map(p=><tr key={p.playerKey}><td>{p.selectedPosition}</td><td>{p.name}</td><td>{p.position}</td><td>{p.team}</td><td>{p.status||'—'}</td></tr>)}</tbody></table></section>
    </main>
  </>;
}
