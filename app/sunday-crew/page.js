import Link from 'next/link';
import SharedEditorialFront from '../components/SharedEditorialFront';
import EditionLeagueSurfaces from '../components/EditionLeagueSurfaces';
import CultureDesk from '../components/CultureDesk';
import {getEditionData,getEditionArticles} from '../../lib/edition-data';
import ReelsShelf from '../components/ReelsShelf';
import {writers} from '../articles/writers';

export const dynamic='force-dynamic';

export default async function SundayCrewPage(){
  const [edition,localArticles]=await Promise.all([getEditionData('sunday-crew'),getEditionArticles('sunday-crew')]);
  if(!edition?.league) return <main><h1>Sunday Crew edition unavailable</h1></main>;
  const rosters=edition?.snapshots?.rosters?.data?.data||[];
  const rosterByName=Object.fromEntries(rosters.map(t=>[t.teamName,t]));
  const featured=name=>rosterByName[name]?.players?.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF')||rosterByName[name]?.players?.[0];
  const headshot=p=>p?.playerId?`https://a.espncdn.com/i/headshots/nfl/players/full/${p.playerId}.png`:'';
  const reels=[
    {id:'35be59702c0c7cca379ab5ca64c28788',short:'ZAYWATCH · DITKA',matchup:'ZAYWATCH vs. Forte inch Ditka',correspondent:'Hollis Crane',avatar:writers.crane.image},
    {id:'8710323881d0b2cb1ec55d3cd8137629',short:'STROKE · ALLENTOWN',matchup:'A Stroke of Bad Luck vs. It’s always sunny in ALLENtown',correspondent:'Maude Gannon',avatar:writers.gannon.image},
    {id:'4847ba749e3df2950b2c8c9d8a11308b',short:'CHANE · RHAMONDRE',matchup:'CHANE GANG vs. Rhamondre — A Cautionary Tale',correspondent:'Sabine March',avatar:writers.march.image},
    {id:'2aabd81db067067020c873233c783454',short:'CROATIA · RBS',matchup:'Croatian Sensation vs. RBs are Overrated',correspondent:'Dashiell Pike',avatar:writers.pike.image},
    {id:'9250b953a32bbb06884b73f46ca43abe',short:'J BIRD · SCRUMP',matchup:'J Bird vs. Scrump',correspondent:'Conrad Sorrell',avatar:writers.sorrell.image},
    {id:'934492ccc99c967bc89ba70313047cdd',short:'WAKE · COOKIES',matchup:'Wake Me Up On September 1st vs. Tolbert’s Cookies',correspondent:'Marnie Kells',avatar:writers.kells.image},
  ].map(r=>{const [a,b]=r.matchup.split(/ vs\. /i);return {...r,leftImage:headshot(featured(a)),rightImage:headshot(featured(b))}});
  return <>
    <header>
      <div className="utility"><span className="utilityMain">SUNDAY CREW EDITION <i>•</i> JOURNALISM WITHOUT PURPOSE</span></div>
      <div className="mast"><h1>{edition.tenant.publication_name}</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div>
      <nav className="siteNav"><Link href="/sunday-crew">HOME</Link><Link href="/sunday-crew#league">THE LEAGUE</Link><Link href="/sunday-crew#standings">STANDINGS</Link><Link href="/sunday-crew#transactions">THE WIRE</Link><Link href="/sunday-crew#scores">SCORES</Link><Link href="/staff">MASTHEAD</Link></nav>
    </header>
    <main>
      <ReelsShelf reels={reels} releaseId="sunday-crew-week4-preview-v1" storageKey="brief-sunday-crew-week4-preview-viewed-v1" weekLabel="THE BRIEF • SUNDAY CREW • WEEK 4" title="Week 4 previews." modeLabel="SUNDAY CREW • WEEK 4 • PREVIEW"/>
      <SharedEditorialFront/>
      {localArticles.length>0&&<section style={{padding:'28px 0',borderTop:'2px solid #11100e'}}><div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:'#b21f24'}}>FROM THE SUNDAY CREW BUREAU</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:24,marginTop:20}}>{localArticles.map(article=><article key={article.id}><Link href={'/sunday-crew/articles/'+article.slug} style={{color:'#11100e',textDecoration:'none'}}><h2 style={{fontFamily:'Georgia,serif',fontSize:28,lineHeight:1.1}}>{article.title}</h2><p style={{fontSize:14,lineHeight:1.5}}>{article.dek}</p></Link></article>)}</div></section>}
      <EditionLeagueSurfaces edition={edition}/>
      <CultureDesk globalOnly/>
    </main>
    <footer><b>The Brief of Ordinary Gentleman</b><span>Sunday Crew bureau • shared newsroom, local grievances.</span></footer>
  </>;
}
