import GlobalArticle from '../../articles/[slug]/page';
import {isGlobalArticle} from '../../../lib/editorial-scope';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getEditionArticles} from '../../../lib/edition-data';

export const dynamic = 'force-dynamic';
const names = {gannon: 'Maude Gannon', crane: 'Hollis Crane', sorrell: 'Conrad Sorrell', kells: 'Marnie Kells', march: 'Sabine March', pike: 'Dashiell Pike'};
export default async function EditionArticle({params,config}) {
  const {slug} = await params;
  const {root,name,slug:editionSlug}=config;
  if(isGlobalArticle(slug))return <GlobalArticle params={params} editionRoot={root}/>;
  const [article] = await getEditionArticles(editionSlug, slug);
  if (!article) notFound();
  return <main style={{maxWidth:760,margin:'0 auto',padding:'44px 22px 90px'}}><Link href={root} style={{color:'#11100e',fontWeight:800,fontSize:12}}>THE BRIEF · {name.toUpperCase()}</Link><article style={{marginTop:48}}><p style={{fontSize:11,letterSpacing:2,color:'#b21f24',fontWeight:800}}>{article.section?.toUpperCase()}</p><h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(38px,7vw,64px)',lineHeight:1.05,letterSpacing:-1.5}}>{article.title}</h1>{article.dek && <p style={{fontFamily:'Georgia,serif',fontSize:23,lineHeight:1.4}}>{article.dek}</p>}<p style={{fontSize:12,borderBottom:'1px solid #d8d2c6',paddingBottom:22,marginBottom:28}}>By {names[article.writer_slug] || 'The Brief'} · {new Date(article.published_at).toLocaleDateString('en-US',{timeZone:'America/New_York',month:'long',day:'numeric',year:'numeric'})}</p>{(Array.isArray(article.body) ? article.body : []).filter(p => typeof p === 'string').map((p,i) => <p key={i} style={{fontFamily:'Georgia,serif',fontSize:20,lineHeight:1.7,marginBottom:24}}>{p}</p>)}</article></main>;
}
