import GlobalArticle from '../../articles/[slug]/page';
import {isSharedArticleForEdition} from '../../../lib/editorial-scope';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getEditionArticles} from '../../../lib/edition-data';


// Render editorial *italics* without treating article text as HTML.
const renderArticleInline = text => text.split(/(\*[^*\n]+\*)/g).map((part,i) => part.startsWith('*') && part.endsWith('*') ? <em key={i}>{part.slice(1,-1)}</em> : part);
export const dynamic = 'force-dynamic';
const names = {gannon: 'Maude Gannon', crane: 'Hollis Crane', sorrell: 'Conrad Sorrell', kells: 'Marnie Kells', march: 'Sabine March', pike: 'Dashiell Pike'};
export default async function EditionArticle({params,config}) {
  const {slug} = await params;
  const {root,name,slug:editionSlug}=config;
  if(isSharedArticleForEdition(slug,editionSlug))return <GlobalArticle params={params} editionRoot={root}/>;
  const [article] = await getEditionArticles(editionSlug, slug);
  if (!article) notFound();
  return <main style={{maxWidth:760,margin:'0 auto',padding:'44px 22px 90px'}}><Link href={root} style={{color:'#11100e',fontWeight:800,fontSize:12}}>THE BRIEF · {name.toUpperCase()}</Link><article data-editorial-system="a" style={{marginTop:48}}><p className="editorialCategory">{article.section?.toUpperCase()}</p><h1 className="editionArticleTitle">{article.title}</h1>{article.dek && <p className="editorialDeck">{article.dek}</p>}<p className="editorialByline" style={{borderBottom:'1px solid #d8d2c6',paddingBottom:22,marginBottom:28}}>By {names[article.writer_slug] || 'The Brief'} · {new Date(article.published_at).toLocaleDateString('en-US',{timeZone:'America/New_York',month:'long',day:'numeric',year:'numeric'})}</p>{(Array.isArray(article.body) ? article.body : []).filter(p => typeof p === 'string').map((p,i) => <p key={i} className="editorialBody" style={{marginBottom:24}}>{renderArticleInline(p)}</p>)}</article></main>;
}
