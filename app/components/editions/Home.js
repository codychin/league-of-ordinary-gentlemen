import {week8Reels} from '../../../lib/week8-reels';
import StartSitOfWeek from '../StartSitOfWeek';
import AlsoShelf from '../AlsoShelf';
import {loogArticleVideos} from '../../../lib/article-videos';
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
  const previewReels=week8Reels(slug).map(r=>{
    const teamFor=id=>rosters.find(t=>String(t.teamKey).split('.t.')[1]===String(id));
    const a=teamFor(r.teamIds[0]),b=teamFor(r.teamIds[1]);
    return {...r,leftImage:headshot(featured(a?.teamName)),rightImage:headshot(featured(b?.teamName))};
  });
  return <>
    <header>
      <div className="utility"><span className="utilityMain">{name.toUpperCase()} EDITION <i>•</i> JOURNALISM WITHOUT PURPOSE</span></div>
      <div className="mast"><h1>{edition.tenant.publication_name}</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div>
      <nav className="siteNav" aria-label="Primary navigation"><Link href={root+""}>HOME</Link>{LIVE_DESK_ENABLED&&<Link href={root+"#live-desk"}>LIVE DESK</Link>}<Link href={root+"#league"}>THE LEAGUE</Link><Link href={root+"/teams"}>FRANCHISES</Link><Link href={root+"#standings"}>STANDINGS</Link><Link href={root+"#transactions"}>THE WIRE</Link><Link href={root+"#scores"}>SCORES</Link></nav>
    </header>
    <main data-weekly-media={previewReels.length===6||reels.length>0?"present":"absent"}>
      <SundayLiveDesk editionSlug={slug} editionLabel={name.toUpperCase()} staffPath={root+"/newsroom"}/>
      {previewReels.length===6&&<ReelsShelf reels={previewReels} releaseId={`${slug}-week8-preview-v2`} storageKey={`brief-${slug}-week8-preview-viewed-v2`} weekLabel={`${name.toUpperCase()} • WEEK 8`} title="Week 8, the previews." modeLabel="WEEK 8 • PREVIEWS" mediaKind="preview" autoOpenFromQuery={false}/>}
      {previewReels.length!==6&&reels.length>0&&<ReelsShelf reels={reels} releaseId={config.reelRelease} storageKey={config.reelStorage||config.reelRelease+"-viewed"} weekLabel={config.reelLabel} title={config.reelTitle} modeLabel={config.reelLabel}/>}
      <SharedEditorialFront root={root} archiveHref={root+"/archive"}/>
      {localArticles.length>0&&<section data-editorial-system="a" style={{padding:'28px 0',borderTop:'2px solid #11100e'}}><div className="editorialSectionLabel">FROM THE {name.toUpperCase()} BUREAU</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:24,marginTop:20}}>{localArticles.map(article=><article key={article.id}><Link href={(root+'/articles/')+article.slug} style={{color:'#11100e',textDecoration:'none'}}><h2 className="editorialCardTitle">{article.title}</h2><p className="editorialDeck">{article.dek}</p></Link></article>)}</div></section>}
      <EditionLeagueSurfaces edition={edition} headshots={headshots} config={config}/>
      <StartSitOfWeek edition={slug} headshots={headshots}/>
      <AlsoShelf videos={loogArticleVideos}/>
      <CultureDesk globalOnly root={root} extraSlugs={slug==='doge'?['conrad-white-coaches-lose-individually']:[]}/>
    </main>
    <footer><b>The Brief of Ordinary Gentleman</b><span>{name} bureau • shared newsroom, local grievances.</span></footer>
  </>;
}
