import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import EditionSiteNav from '../../components/EditionSiteNav'
import AuthorByline from '../../components/AuthorByline'
import draft from './draft.json'

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

// Standalone preservation route only: intentionally absent from article inventory,
// Home and Crates. This staging snapshot must not publish a future rewrite.
export default function BakerDraft({editionRoot=""}){
  return <>
    <header className="articleHeader"><Link href={editionRoot||"/"} className="miniMast">The Brief of Ordinary Gentleman</Link>{editionRoot?<EditionSiteNav root={editionRoot}/>:<SiteNav/>}</header>
    <main className="articleMain" data-editorial-system="a" data-app-section="league">
      <div className="eyebrow">Unpublished draft</div>
      <h1 className="articleTitle">{draft.title}</h1>
      <div className="articleBylineShare"><AuthorByline root={editionRoot} slug="maude-baker-comparative-merits-of-abstention" date="Preserved draft"/></div>
      <p className="articleDek">{draft.subtitle}</p>
      <p className="articleSource" role="note">Draft image pending — archive reference not yet attached.</p>
      <article className="articleBody">{draft.paragraphs.map((text,i)=><p key={i}>{inline(text)}</p>)}</article>
      <Link className="back" href={editionRoot||"/"}>← RETURN TO THE FRONT PAGE</Link>
    </main>
  </>
}
