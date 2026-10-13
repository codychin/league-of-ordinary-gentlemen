import StartSitOfWeek from '../StartSitOfWeek';
import AlsoShelf from '../AlsoShelf';
import {globalArticleVideos} from '../../../lib/article-videos';
import {LIVE_DESK_ENABLED} from '../../../lib/live-desk-state';
import Link from 'next/link';
import SharedEditorialFront from '../SharedEditorialFront';
import EditionLeagueSurfaces from '../EditionLeagueSurfaces';
import CultureDesk from '../CultureDesk';
import {getEditionData,getEditionArticles,getNflHeadshotsByYahooId} from '../../../lib/edition-data';
import ReelsShelf from '../ReelsShelf';
import SundayLiveDesk from '../SundayLiveDesk';
import {writers} from '../../articles/writers';

export const dynamic='force-dynamic';

export default async function Home({config}){
  const {root,name,slug,publicationName}=config;
  const [edition,localArticles,headshots]=await Promise.all([getEditionData(slug),getEditionArticles(slug),getNflHeadshotsByYahooId()]);
  if(!edition?.league) return <main><h1>{name} edition unavailable</h1></main>;
  const rosters=edition?.snapshots?.rosters?.data?.data||[];
  const rosterByName=Object.fromEntries(rosters.map(t=>[t.teamName,t]));
  const featured=name=>rosterByName[name]?.players?.find(p=>!['BN','IR'].includes(p.selectedPosition)&&p.position!=='K'&&p.position!=='DEF'&&headshots[String(p.playerId)])||rosterByName[name]?.players?.find(p=>headshots[String(p.playerId)])||null;
  const headshot=p=>p?.playerId?(headshots[String(p.playerId)]||''):'';
  const reels=(config.reels||[]).map(r=>{const a=rosters.find(t=>t.teamKey===r.leftKey)?.teamName,b=rosters.find(t=>t.teamKey===r.rightKey)?.teamName;return {...r,leftImage:headshot(featured(a)),rightImage:headshot(featured(b))}});
  return <>
    <header>
      <div className="utility"><span className="utilityMain">{name.toUpperCase()} EDITION <i>•</i> JOURNALISM WITHOUT PURPOSE</span></div>
      <div className="mast"><h1>{edition.tenant.publication_name}</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div>
      <nav className="siteNav"><Link href={root+""}>HOME</Link>{LIVE_DESK_ENABLED&&<Link href={root+"#live-desk"}>LIVE DESK</Link>}<Link href={root+"#league"}>THE LEAGUE</Link><Link href={root+"/teams"}>FRANCHISES</Link><Link href={root+"#standings"}>STANDINGS</Link><Link href={root+"#transactions"}>THE WIRE</Link><Link href={root+"#scores"}>SCORES</Link></nav>
    </header>
    <main>
      <SundayLiveDesk editionSlug={slug} editionLabel={name.toUpperCase()} staffPath={root+"/newsroom"}/>
      {reels.length>0&&<ReelsShelf reels={reels} releaseId={config.reelRelease} storageKey={config.reelStorage||config.reelRelease+"-viewed"} weekLabel={config.reelLabel} title={config.reelTitle} modeLabel={config.reelLabel}/>}
      <SharedEditorialFront root={root} archiveHref={root+"/archive"}/>
      {localArticles.length>0&&<section style={{padding:'28px 0',borderTop:'2px solid #11100e'}}><div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:'#b21f24'}}>FROM THE {name.toUpperCase()} BUREAU</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:24,marginTop:20}}>{localArticles.map(article=><article key={article.id}><Link href={(root+'/articles/')+article.slug} style={{color:'#11100e',textDecoration:'none'}}><h2 style={{fontFamily:'Georgia,serif',fontSize:28,lineHeight:1.1}}>{article.title}</h2><p style={{fontSize:14,lineHeight:1.5}}>{article.dek}</p></Link></article>)}</div></section>}
      <EditionLeagueSurfaces edition={edition} headshots={headshots} config={config}/>
      <StartSitOfWeek/>
      <AlsoShelf videos={globalArticleVideos}/>
      <CultureDesk globalOnly root={root} extraSlugs={slug==='doge'?['conrad-white-coaches-lose-individually']:[]}/>
    </main>
    <footer><b>The Brief of Ordinary Gentleman</b><span>{name} bureau • shared newsroom, local grievances.</span></footer>
  </>;
}
