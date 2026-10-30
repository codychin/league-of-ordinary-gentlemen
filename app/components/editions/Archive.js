import styles from '../Crates.module.css';
import Link from 'next/link';
import {archive} from '../../articles/data';
import {isSharedArticleForEdition} from '../../../lib/editorial-scope';
import {getEditionArticles} from '../../../lib/edition-data';
import {crateArticle} from '../../../lib/crates.mjs';
import EditionSiteNav from '../EditionSiteNav';
import Crates from '../Crates';
export const dynamic='force-dynamic';
export default async function Archive({config}){
  const {root,slug:editionSlug,publicationName}=config;
  const editionArticles=await getEditionArticles(editionSlug);
  const stories=new Map(archive.filter(a=>isSharedArticleForEdition(a.slug,editionSlug)).map(a=>[a.slug,a]));
  for(const a of editionArticles)if(!stories.has(a.slug))stories.set(a.slug,a);
  return <><header className={`articleHeader ${styles.header}`}><Link href={root} className="miniMast">{publicationName}</Link><EditionSiteNav root={root}/></header><Crates articles={[...stories.values()].map(a=>crateArticle(a,root))}/></>;
}
