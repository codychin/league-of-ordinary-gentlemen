import Link from 'next/link';
import {writers} from '../../articles/writers';
import {staffBios} from '../../articles/staff-bios';

export default function Newsroom({config}) {
  const {root,name:editionName,slug:editionSlug,publicationName}=config;
  return <>
    <header className="articleHeader"><nav className="siteNav"><Link href={root+""}>HOME</Link><Link href={root+"/teams"}>THE LEAGUE</Link><Link href={root+"#scores"}>SCORES</Link></nav></header>
    <main className="staffPage">
      <section className="directoryHead"><div className="eyebrow">THE MASTHEAD • {editionName.toUpperCase()}</div><h1>The Newsroom</h1><p>The Brief’s correspondents, reporting for {editionName}.</p></section>
      <div className="staffGrid">{Object.values(writers).filter(writer=>writer.slug!=='newsroom').map((writer,index)=><article id={writer.slug} className="staffCard" key={writer.slug}>
        <figure className="staffPortrait"><img src={writer.image} alt={writer.imageAlt}/><figcaption>{String(index+1).padStart(2,'0')} / {staffBios[writer.slug]?.title || writer.title}</figcaption></figure>
        <div className="staffProfile"><h2>{writer.name}</h2>{staffBios[writer.slug].paragraphs.map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div>
      </article>)}</div>
      <Link className="back" href={root+""}>← RETURN TO {editionName.toUpperCase()}</Link>
    </main>
  </>;
}
