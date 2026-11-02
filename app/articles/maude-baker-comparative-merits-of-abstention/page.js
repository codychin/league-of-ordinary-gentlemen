import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import EditionSiteNav from '../../components/EditionSiteNav'
import AuthorByline from '../../components/AuthorByline'
import draft from './draft.json'
import ResilientImage from '../../components/ResilientImage'
import {bakerPhoto} from './photo'

export const metadata={
  title:`${draft.title} • Draft • The Brief`,
  description:draft.subtitle,
  robots:{index:false,follow:false},
}

function inline(text){
  return text.split(/(\*[^*\n]+\*|\[[^\]]+\]\(https:\/\/[^)]+\))/g).map((part,i)=>{
    if(part.startsWith('*')&&part.endsWith('*'))return <em key={i}>{part.slice(1,-1)}</em>
    const link=part.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/)
    if(link)return <a key={i} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    return part
  })
}

// Approved staging headline; preserve the copy and keep production publication separate.
export default function BakerDraft({editionRoot=""}){
  return <>
    <header className="articleHeader"><Link href={editionRoot||"/"} className="miniMast">The Brief of Ordinary Gentleman</Link>{editionRoot?<EditionSiteNav root={editionRoot}/>:<SiteNav/>}</header>
    <main className="articleMain" data-editorial-system="a" data-app-section="league">
      <div className="eyebrow">Unpublished draft</div>
      <h1 className="articleTitle">{draft.title}</h1>
      <div className="articleBylineShare"><AuthorByline root={editionRoot} slug="maude-baker-comparative-merits-of-abstention" date="Preserved draft"/></div>
      <p className="articleDek">{draft.subtitle}</p>
      <figure style={{margin:0}}><ResilientImage className="articleImage" src={bakerPhoto.src} alt={bakerPhoto.alt} loading="eager" style={{display:"block",width:"100%",height:"auto",aspectRatio:"3 / 2",objectFit:"contain"}}/><figcaption className="articleSource"><a href={bakerPhoto.source} target="_blank" rel="noreferrer">{bakerPhoto.caption}</a></figcaption></figure>
      <article className="articleBody">{draft.paragraphs.map((text,i)=><p key={i}>{inline(text)}</p>)}</article>
      <Link className="back" href={editionRoot||"/"}>← RETURN TO THE FRONT PAGE</Link>
    </main>
  </>
}
