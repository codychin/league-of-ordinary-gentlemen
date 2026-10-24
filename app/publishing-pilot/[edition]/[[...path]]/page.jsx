import {notFound} from 'next/navigation';
import {readSnapshot} from '../../../../lib/publishing-pilot/server';
import {EDITIONS} from '../../../../lib/publishing-pilot/model.mjs';
import Article from '../../../articles/[slug]/page';
import Front from '../../Front';
import Publisher from '../../Publisher';
import Link from 'next/link';
export const dynamic='force-dynamic';
async function load(params,searchParams){
 const {edition,path=[]}=await params,q=await searchParams;
 if(!EDITIONS.includes(edition)||path.length>2)notFound();
 const release=await readSnapshot(edition,q?.revision||null);
 return {edition,path,release,revisionQuery:q?.revision?"?revision="+encodeURIComponent(release.digest):""};
}
export async function generateMetadata({params,searchParams}){
 try{const {path,release}=await load(params,searchParams);const a=release.snapshot.articles[path[1]];
 return {title:a?.title||'Staging editorial pilot',description:a?.dek,robots:{index:false,follow:false}};
 }catch{return {title:'Staging pilot unavailable',robots:{index:false,follow:false}};}
}
export default async function Page({params,searchParams}){
 let value;try{value=await load(params,searchParams)}catch{return <main><h1>Staging pilot unavailable</h1><p>Authenticated access to an isolated pilot database is required. No production fallback is used.</p></main>}
 const {edition,path,release,revisionQuery}=value,root='/publishing-pilot/'+edition,snapshot=release.snapshot;
 let content;
 if(!path.length)content=<Front snapshot={snapshot} root={root} revisionQuery={revisionQuery}/>;
 else if(path[0]==='articles'&&snapshot.articles[path[1]])content=<Article params={Promise.resolve({slug:path[1]})} editionRoot={root} articleOverride={snapshot.articles[path[1]]} pilot pilotRevisionQuery={revisionQuery}/>;
 else if(path[0]==='archive')content=<main><h1>Staging archive</h1>{[...snapshot.home,...snapshot.archive].map(slug=><p key={slug}><Link prefetch={false} href={root+'/articles/'+slug+revisionQuery}>{snapshot.articles[slug].title}</Link></p>)}</main>;
 else notFound();
 return <div data-pilot-release={release.digest} data-pilot-renderer={release.renderer} data-pilot-generation={release.generation}><aside><b>STAGING ONLY — editorial publishing pilot</b><p>Release {release.digest}</p><Publisher renderer={release.renderer} viewer={release.actor} digest={release.digest} generation={release.generation} preflightReady={release.preflightReady}/></aside>{content}</div>;
}
