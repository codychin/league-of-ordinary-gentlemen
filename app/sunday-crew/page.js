import Link from 'next/link';
import SharedEditorialFront from '../components/SharedEditorialFront';
import EditionLeagueSurfaces from '../components/EditionLeagueSurfaces';
import CultureDesk from '../components/CultureDesk';
import {getEditionData} from '../../lib/edition-data';

export const dynamic='force-dynamic';

export default async function SundayCrewPage(){
  const edition=await getEditionData('sunday-crew');
  if(!edition?.league) return <main><h1>Sunday Crew edition unavailable</h1></main>;
  return <>
    <header>
      <div className="utility"><span className="utilityMain">SUNDAY CREW EDITION <i>•</i> JOURNALISM WITHOUT PURPOSE</span></div>
      <div className="mast"><h1>The Brief of Ordinary Gentleman</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div>
      <nav className="siteNav"><Link href="/sunday-crew">HOME</Link><Link href="/sunday-crew#league">THE LEAGUE</Link><Link href="/sunday-crew#standings">STANDINGS</Link><Link href="/sunday-crew#transactions">THE WIRE</Link><Link href="/sunday-crew#scores">SCORES</Link><Link href="/staff">MASTHEAD</Link></nav>
    </header>
    <main>
      <SharedEditorialFront/>
      <EditionLeagueSurfaces edition={edition}/>
      <CultureDesk globalOnly/>
    </main>
    <footer><b>The Brief of Ordinary Gentleman</b><span>Sunday Crew bureau • shared newsroom, local grievances.</span></footer>
  </>;
}
