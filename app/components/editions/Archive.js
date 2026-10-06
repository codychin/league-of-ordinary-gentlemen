import Link from 'next/link';
import {archive} from '../../articles/data';
import {isGlobalArticle} from '../../../lib/editorial-scope';
import {getEditionArticles} from '../../../lib/edition-data';

export const dynamic='force-dynamic';

export default async function Archive({params,config}){
  const {root,name:editionName,slug:editionSlug,publicationName}=config;
  const editionArticles=await getEditionArticles(editionSlug);
  const stories=new Map(archive.filter(a=>isGlobalArticle(a.slug)).map(a=>[a.slug,{...a,href:root+'/articles/'+a.slug}]));
  for(const a of editionArticles)if(!stories.has(a.slug))stories.set(a.slug,{...a,href:(root+"/articles/")+a.slug});
  const ordered=[...stories.values()].sort((a,b)=>Date.parse(b.published_at||b.date||0)-Date.parse(a.published_at||a.date||0));
  return <><header className="articleHeader"><Link href={root+""} className="miniMast">{publicationName}</Link><nav className="siteNav"><Link href={root+""}>HOME</Link><Link href={root+"#scores"}>SCORES</Link><Link href={root+"/newsroom"}>MASTHEAD</Link></nav></header>
    <main><section className="directoryHead"><div className="eyebrow">THE PERMANENT RECORD</div><h1>Article Archive</h1><p>Every take preserved long enough to become evidence.</p></section>
      <div className="archiveWrap"><section className="archiveWeek"><div className="weekNum">THE ARCHIVE</div><div>{ordered.map(a=><Link href={a.href} className="archiveStory" key={a.slug}><small>{a.section}</small><h2>{a.title}</h2><p>{a.dek}</p><span>READ / SAVE FOR RECEIPTS →</span></Link>)}</div></section></div>
    </main></>;
}
