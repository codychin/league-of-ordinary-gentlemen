import StartSitOfWeek from '../components/StartSitOfWeek';
import AlsoShelf from '../components/AlsoShelf';
import {globalArticleVideos} from '../../lib/article-videos';
import {LIVE_DESK_ENABLED} from '../../lib/live-desk-state';
import Link from 'next/link';
import BreakingNewsBanner from '../components/BreakingNewsBanner';
import SharedEditorialFront from '../components/SharedEditorialFront';
import EditionLeagueSurfaces from '../components/EditionLeagueSurfaces';
import CultureDesk from '../components/CultureDesk';
import {getEditionData,getEditionArticles,getNflHeadshotsByYahooId} from '../../lib/edition-data';
import ReelsShelf from '../components/ReelsShelf';
import SundayLiveDesk from '../components/SundayLiveDesk';
import {writers} from '../articles/writers';

export const dynamic='force-dynamic';

export default async function SundayCrewPage(){
  const [edition,localArticles,headshots]=await Promise.all([getEditionData('sunday-crew'),getEditionArticles('sunday-crew'),getNflHeadshotsByYahooId()]);
  if(!edition?.league) return <main><h1>Sunday Crew edition unavailable</h1></main>;
  const rosters=edition?.snapshots?.rosters?.data?.data||[];
  const rosterByName=Object.fromEntries(rosters.map(t=>[t.teamName,t]));
  const featured=name=>rosterByName[name]?.players?.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF'&&headshots[String(p.playerId)])||rosterByName[name]?.players?.find(p=>headshots[String(p.playerId)])||null;
  const headshot=p=>p?.playerId?(headshots[String(p.playerId)]||''):'';
  const reels=[
    {id:'1c0b8905ec7c5a31173562cef17549cb',leftKey:'470.l.197826.t.1',rightKey:'470.l.197826.t.5',short:'ZAYWATCH · DITKA',matchup:'ZAYWATCH vs. Forte inch Ditka',correspondent:'Hollis Crane',avatar:writers.crane.image},
    {id:'835f2b6c72cdc34ffef914114ea02c79',leftKey:'470.l.197826.t.2',rightKey:'470.l.197826.t.6',short:'STROKE · ALLENTOWN',matchup:'A Stroke of Bad Luck vs. It’s always sunny in ALLENtown',correspondent:'Maude Gannon',avatar:writers.gannon.image},
    {id:'5f0a8e1f3785065f12fbc71e99a668ba',leftKey:'470.l.197826.t.10',rightKey:'470.l.197826.t.3',short:'CHANE · RHAMONDRE',matchup:'CHANE GANG vs. Rhamondre — A Cautionary Tale',correspondent:'Sabine March',avatar:writers.march.image},
    {id:'e35e3266d7177d3e2cbd09085ff85005',leftKey:'470.l.197826.t.4',rightKey:'470.l.197826.t.12',short:'CROATIA · RBS',matchup:'Croatian Sensation vs. RBs are Overrated',correspondent:'Dashiell Pike',avatar:writers.pike.image},
    {id:'2982235e27369853455caa7d11a4c6e6',leftKey:'470.l.197826.t.7',rightKey:'470.l.197826.t.9',short:'J BIRD · SCRUMP',matchup:'J Bird vs. Scrump',correspondent:'Conrad Sorrell',avatar:writers.sorrell.image},
    {id:'b0c6db2e5cab237055794b15f32f0c8f',leftKey:'470.l.197826.t.8',rightKey:'470.l.197826.t.11',short:'WAKE · COOKIES',matchup:'Wake Me Up On September 1st vs. Tolbert’s Cookies',correspondent:'Marnie Kells',avatar:writers.kells.image},
  ].map(r=>{const a=rosters.find(t=>t.teamKey===r.leftKey)?.teamName,b=rosters.find(t=>t.teamKey===r.rightKey)?.teamName;return {...r,leftImage:headshot(featured(a)),rightImage:headshot(featured(b))}});
  return <>
    <header>
      <div className="utility"><span className="utilityMain">SUNDAY CREW EDITION <i>•</i> JOURNALISM WITHOUT PURPOSE</span></div>
      <div className="mast"><h1>{edition.tenant.publication_name}</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div>
      <nav className="siteNav"><Link href="/sunday-crew">HOME</Link>{LIVE_DESK_ENABLED&&<Link href="/sunday-crew#live-desk">LIVE DESK</Link>}<Link href="/sunday-crew#league">THE LEAGUE</Link><Link href="/sunday-crew#standings">STANDINGS</Link><Link href="/sunday-crew#transactions">THE WIRE</Link><Link href="/sunday-crew#scores">SCORES</Link><Link href="/sunday-crew/newsroom">MASTHEAD</Link></nav>
    </header>
    <BreakingNewsBanner/>
    <main>
      <SundayLiveDesk editionSlug="sunday-crew" editionLabel="SUNDAY CREW" staffPath="/sunday-crew/newsroom"/>
      <ReelsShelf reels={reels} releaseId="sunday-crew-week4-recap-v1" storageKey="brief-sunday-crew-week4-recap-viewed-v1" weekLabel="THE BRIEF • SUNDAY CREW • WEEK 4" title="Week 4, the aftermath." modeLabel="SUNDAY CREW • WEEK 4 • RECAP"/>
      <SharedEditorialFront archiveHref="/sunday-crew/archive"/>
      {localArticles.length>0&&<section style={{padding:'28px 0',borderTop:'2px solid #11100e'}}><div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:'#b21f24'}}>FROM THE SUNDAY CREW BUREAU</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:24,marginTop:20}}>{localArticles.map(article=><article key={article.id}><Link href={'/sunday-crew/articles/'+article.slug} style={{color:'#11100e',textDecoration:'none'}}><h2 style={{fontFamily:'Georgia,serif',fontSize:28,lineHeight:1.1}}>{article.title}</h2><p style={{fontSize:14,lineHeight:1.5}}>{article.dek}</p></Link></article>)}</div></section>}
      <EditionLeagueSurfaces edition={edition} headshots={headshots}/>
      <StartSitOfWeek/>
      <AlsoShelf videos={globalArticleVideos}/>
      <CultureDesk globalOnly/>
    </main>
    <footer><b>The Brief of Ordinary Gentleman</b><span>Sunday Crew bureau • shared newsroom, local grievances.</span></footer>
  </>;
}
