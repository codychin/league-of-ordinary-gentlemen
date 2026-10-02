import Link from 'next/link';
import {writers} from '../../articles/writers';

export const metadata = {title: 'Sunday Crew Newsroom — The Brief'};
export default function SundayCrewNewsroom() {
  return <>
    <header className="articleHeader"><nav className="siteNav"><Link href="/sunday-crew">HOME</Link><Link href="/sunday-crew/teams">THE LEAGUE</Link><Link href="/sunday-crew#scores">SCORES</Link></nav></header>
    <main className="staffPage">
      <section className="directoryHead"><div className="eyebrow">THE MASTHEAD • SUNDAY CREW</div><h1>The Newsroom</h1><p>The Brief’s correspondents, reporting for Sunday Crew.</p></section>
      <div className="staffGrid">{Object.values(writers).filter(writer=>writer.slug!=='newsroom').map((writer,index)=><article id={writer.slug} className="staffCard" key={writer.slug}>
        <figure className="staffPortrait"><img src={writer.image} alt={writer.imageAlt}/><figcaption>{String(index+1).padStart(2,'0')} / {writer.title}</figcaption></figure>
        <div className="staffProfile"><h2>{writer.name}</h2><dl><div><dt>METHOD</dt><dd>{writer.method}</dd></div><div><dt>ON THE PAGE</dt><dd>{writer.voice}</dd></div><div><dt>SIGNATURE</dt><dd>{writer.signature}</dd></div></dl></div>
      </article>)}</div>
      <Link className="back" href="/sunday-crew">← RETURN TO SUNDAY CREW</Link>
    </main>
  </>;
}
