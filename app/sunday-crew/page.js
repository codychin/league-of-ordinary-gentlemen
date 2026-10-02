import Link from 'next/link';
import SharedEditorialFront from '../components/SharedEditorialFront';
import EditionLeagueSurfaces from '../components/EditionLeagueSurfaces';
import CultureDesk from '../components/CultureDesk';
import {getEditionData,getEditionArticles} from '../../lib/edition-data';

export const dynamic='force-dynamic';

export default async function SundayCrewPage(){
  const [edition,localArticles]=await Promise.all([getEditionData('sunday-crew'),getEditionArticles('sunday-crew')]);
  if(!edition?.league) return <main><h1>Sunday Crew edition unavailable</h1></main>;
  return <>
    <header>
      <div className="utility"><span className="utilityMain">SUNDAY CREW EDITION <i>•</i> JOURNALISM WITHOUT PURPOSE</span></div>
      <div className="mast"><h1>{edition.tenant.publication_name}</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div>
      <nav className="siteNav"><Link href="/sunday-crew">HOME</Link><Link href="/sunday-crew#league">THE LEAGUE</Link><Link href="/sunday-crew#standings">STANDINGS</Link><Link href="/sunday-crew#transactions">THE WIRE</Link><Link href="/sunday-crew#scores">SCORES</Link><Link href="/staff">MASTHEAD</Link></nav>
    </header>
    <main>
      <SharedEditorialFront/>
      {localArticles.length>0&&<section style={{padding:'28px 0',borderTop:'2px solid #11100e'}}><div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:'#b21f24'}}>FROM THE SUNDAY CREW BUREAU</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:24,marginTop:20}}>{localArticles.map(article=><article key={article.id}><Link href={'/sunday-crew/articles/'+article.slug} style={{color:'#11100e',textDecoration:'none'}}><h2 style={{fontFamily:'Georgia,serif',fontSize:28,lineHeight:1.1}}>{article.title}</h2><p style={{fontSize:14,lineHeight:1.5}}>{article.dek}</p></Link></article>)}</div></section>}
      <EditionLeagueSurfaces edition={edition}/>
      <CultureDesk globalOnly/>
    </main>
    <footer><b>The Brief of Ordinary Gentleman</b><span>Sunday Crew bureau • shared newsroom, local grievances.</span></footer>
  </>;
}
