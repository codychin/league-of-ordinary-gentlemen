import ArticleClip from '../../components/ArticleClip'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {articles} from '../data'
import Comments from '../Comments'
import SiteNav from '../../components/SiteNav'
import EditionSiteNav from '../../components/EditionSiteNav'
import AuthorByline from '../../components/AuthorByline'
import ArticleReactions from '../../components/ArticleReactions'
import ShareArticle from '../../components/ShareArticle'
import ResilientImage from '../../components/ResilientImage'

const SITE_ORIGIN='https://www.ordinarybrief.com'
const canonicalSlug=slug=>slug==='sabine-chest-speculation-statement'?'sabine-chest-statement':slug
export async function generateMetadata({params}){
  const raw=await params
  const slug=canonicalSlug(raw.slug)
  const a=articles[slug]
  if(!a) return {title:'Story not found • The Brief'}
  const url=`${SITE_ORIGIN}/articles/${slug}`
  const image=a.image?new URL(a.image,SITE_ORIGIN).href:undefined
  return {
    title:`${a.title} • The Brief`,
    description:a.dek,
    alternates:{canonical:url},
    openGraph:{title:a.title,description:a.dek,url,siteName:'The Brief of Ordinary Gentleman',type:'article',images:image?[{url:image,alt:a.imageAlt||a.title}]:[]},
    twitter:{card:image?'summary_large_image':'summary',title:a.title,description:a.dek,images:image?[image]:[]},
  }
}
export default async function Article({params,editionRoot=""}){const{slug}=await params;if(slug==='sabine-chest-speculation-statement')redirect('/articles/sabine-chest-statement');const a=articles[slug];if(!a)return <main className="articleMain"><h1>Story not found.</h1><Link href="/">Return home</Link></main>;const culture=a.section.startsWith('MATTERS OF CULTURE');const returnHref=culture?(editionRoot||'/')+'?tab=culture#culture':editionRoot||'/';const imageFirst=slug==='hollis-body-keeps-score';const heroImage=a.image&&(a.image.startsWith('data:')?<div className="articleImage articleImageInline" role="img" aria-label={a.imageAlt||""} style={{backgroundImage:`url("${a.image}")`}}/>:<><ResilientImage className={`articleImage ${slug==='sabine-chest-statement'?'sabineArticleImage':''}`} src={a.image} alt={a.imageAlt||''}/>{a.imageCredit&&<div className="articleImageCredit">PHOTO: <a href={a.imageCredit.url} target="_blank" rel="noreferrer">{a.imageCredit.label}</a></div>}</>);return <>{culture&&<script dangerouslySetInnerHTML={{__html:"document.documentElement.dataset.appTab='culture'"}}/>}<header className="articleHeader"><Link href={editionRoot||"/"} className="miniMast">The Brief of Ordinary Gentleman</Link>{editionRoot?<EditionSiteNav root={editionRoot}/>:<SiteNav/>}</header><main className="articleMain" data-app-section={culture?'culture':'league'}>{imageFirst&&heroImage}<div className="eyebrow">{a.section}</div><h1 className="articleTitle">{a.title}</h1><p className="articleDek">{a.dek}</p>{a.tweetId&&<ArticleClip tweetId={a.tweetId} url={a.tweetUrl} caption={a.clipCaption}/>}<div className="articleBylineShare"><AuthorByline root={editionRoot} slug={slug} date={a.date}/><ShareArticle slug={slug} title={a.title} dek={a.dek}/></div>{!imageFirst&&heroImage} {a.source&&<div className="articleSource">SOURCE: <a href={a.source.url} target="_blank" rel="noreferrer">{a.source.label}</a></div>}<div className="articleRule"/><article className="articleBody">{a.body.map((p,i)=>typeof p==="string"?<p key={i}>{p}</p>:p?.type==="rich"?<p key={i} dangerouslySetInnerHTML={{__html:p.html}}/>:p?.type==="heading"?<h2 className="articleSectionHead" key={i}>{p.text}</h2>:p?.type==="break"?<div className="articleBreather" key={i} aria-hidden="true"/>:null)}</article><aside className="receipt"><small>THE RECEIPTS</small><b>{a.receipt}</b><span>Filed permanently. Revisit at your own risk.</span></aside><ArticleReactions slug={slug}/><Comments slug={slug}/><Link className="back" href={returnHref}>← RETURN TO THE FRONT PAGE</Link></main></>}
