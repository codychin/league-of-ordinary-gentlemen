import Link from 'next/link';
import styles from './ArchiveCta.module.css';
import front from './SharedEditorialFront.module.css';
import ArticleClip from './ArticleClip';
import PreviewAuthor from './PreviewAuthor';
import ResilientImage from './ResilientImage';

export default function SharedEditorialFront({archiveHref='/archive',root=''}){
  return <>
<section className="morningBriefPreview sundayFront" style={{paddingTop:0}} aria-label="On Assignment: Dashiell Pike in London">
  <div className="morningBriefFlag"><span>ON ASSIGNMENT</span><small>DASHIELL PIKE • LONDON • OCTOBER 7</small></div>
  <div className="sundayFrontGrid">
    <article className="sundayFeature sabinePackage">
      <Link href={root+"/articles/dashiell-jaguars-london-future"} className={`sundayFeatureImage storylink ${front.tourHero}`}>
        <ResilientImage loading="eager" decoding="async" style={{objectPosition:"center 42%"}} src="/api/dashiell-london-fans-image" alt="NFL fans gathered in London for an international game."/>
        <div className="actionCaption"><small>DASHIELL PIKE • LONDON</small><b>ON ASSIGNMENT</b></div>
      </Link>
      <div className="sundayFeatureCopy">
        <div className="sabinePackageIntro">
          <small>SPECIAL PROJECTS • CAPITAL & DEMOCRACY</small>
          <Link href={root+"/articles/dashiell-jaguars-london-future"} className="sabinePackageTitle storylink"><h2>Is the NFL’s Future Hiding Inside Its Weirdest Franchise?</h2></Link>
          <p>The Jacksonville Jaguars spent years looking like an NFL problem to be solved. In London, they may have accidentally become something else.</p>
          <PreviewAuthor slug="dashiell-jaguars-london-future"/>
        </div>
        <div className="sabineInlineVideo dashiellLondonVideo">
          <div className="sabineVideoLabel"><small><span className="sabineDesktopLabel">ON ASSIGNMENT • LONDON</span><span className="sabineMobileLabel">FROM LONDON</span></small><span>0:29</span></div>
          <div className="sabineVideoBody">
            <video controls playsInline preload="none" poster="https://cdn.openart.ai/openart/thumbnail/production/2026-10/create-video/TLTpmJfydK54x1UaTK6G/cgt-20261008002242-mexhp_1791390729765_82dc1525.webp" src="https://cdn.openart.ai/openart-ai/production/2026-10/create-video/TLTpmJfydK54x1UaTK6G/cgt-20261008002242-mexhp_1791390692996_b5b0afba.mp4"/>
          </div>
        </div>
        <Link href={root+"/articles/dashiell-jaguars-london-future"} className="sabinePackageCta">READ THE DISPATCH →</Link>
      </div>
    </article>
  </div>
</section>

<section className={front.recent} aria-label="Recent stories">
<article className={front.card} aria-label="Marnie Kells on Joe Mixon"><Link className={front.story} href={root+"/articles/marnie-joe-mixon-nostalgia-era"}><div className={front.image} style={{backgroundImage:"url('/images/editorial/joe-mixon-comeback.jpg')",backgroundPosition:"center 62%"}}/><div className="eyebrow">THE COMEBACK ECONOMY</div><h3>Joe Mixon’s Comeback Enters Its Nostalgia Era</h3><PreviewAuthor slug="marnie-joe-mixon-nostalgia-era"/><p className={front.dek}>For a brief, beautiful period, he was back. Those who were online will understand.</p><div className="read">READ MARNIE →</div></Link></article>
<article className={front.card} aria-label="Hollis Crane on Bryce Young"><Link className={front.story} href={root+"/articles/hollis-bryce-young-good-time"}><div className={front.image} style={{backgroundImage:"url('/images/editorial/bryce-smiles-collage.jpg')"}}/><div className="eyebrow">SPORTING DISPOSITION</div><h3>Is Bryce Young Really Having That Good of a Time?</h3><PreviewAuthor slug="hollis-bryce-young-good-time"/><p className={front.dek}>The Panthers quarterback keeps smiling. His colleagues have chosen to find this reassuring.</p><div className="read">READ HOLLIS →</div></Link></article>
<article className={front.card} aria-label="Conrad Sorrell on Mike Tomlin"><Link className={front.story} href={root+"/articles/conrad-tomlin-minecraft-cvs"}><div className={front.image} style={{backgroundImage:"url('/images/editorial/tomlin-minecraft-city.jpg')",backgroundSize:"contain",backgroundRepeat:"no-repeat",backgroundColor:"#171613"}}/><div className="eyebrow">COLUMN • POWER & AMERICAN ARRANGEMENTS</div><h3>In a World Without Scarcity, Mike Tomlin Built a CVS</h3><PreviewAuthor slug="conrad-tomlin-minecraft-cvs"/><p className={front.dek}>An architectural tour of a civilization where anything is possible and the pharmacy is conveniently located.</p><div className="read">READ CONRAD →</div></Link></article>
</section>
<section className="hero heroStack" aria-label="Marnie Kells on the corgi race">
  <Link className="hero-copy storylink" href={root+"/articles/marnie-corgi-he-wanted-them-to-know"}>
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.52),rgba(0,0,0,.08)),url('/images/editorial/corgi-look-back-bw.png')",backgroundPosition:"center"}}>
      <div><small>MARNIE KELLS • CULTURE</small><b>HE WANTED THEM TO KNOW</b></div>
    </div>
    <div className="eyebrow">MATTERS OF CULTURE • SPORTING LIFE</div>
    <h2>He Wanted Them to Know He Knew.</h2>
    <PreviewAuthor slug="marnie-corgi-he-wanted-them-to-know"/>
    <p className="standfirst">Winning the corgi race was insufficient. He needed witnesses.</p>
    <div className="read">READ MARNIE →</div>
  </Link>
</section>
<section className="hero heroStack" aria-label="Marnie Kells on Tee Higgins">
  <Link className="hero-copy storylink" href={root+"/articles/marnie-tee-higgins-ankles"}>
    <div className="eyebrow">MATTERS OF CULTURE • IN MEMORIAM • OCTOBER 4</div>
    <h2>Tee Higgins’ Ankles Have Asked to Be Buried Separately</h2>
    <PreviewAuthor slug="marnie-tee-higgins-ankles"/>
    <p className="standfirst">The family is contesting Travis Hunter’s appointment as executor.</p>
    <div className="read">READ MARNIE</div>
  </Link>
  <div className={front.clip}><ArticleClip tweetId="2106801789630919072" url="https://x.com/fballforeverhq/status/2106801789630919072" showCaption={false}/></div>
</section>
<section className="hero heroStack" aria-label="Featured Conrad Sorrell column">
  <Link className="hero-copy storylink" href={root+"/articles/conrad-deshaun-watson-cleveland-hope"}>
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.58),rgba(0,0,0,.08)),url('https://img.ksl.com/slc/3198/319896/31989626.jpg?filter=kslv2%2Fresponsive_story_lg&v=1787444404')",backgroundPosition:"center 34%"}}>
      <div><small>CONRAD SORRELL • COLUMN</small><b>GROPER CLEVELAND IS 3–1</b></div>
    </div>
    <div className="eyebrow">COLUMN • POWER & AMERICAN ARRANGEMENTS</div>
    <h2>Groper Cleveland <em>Is 3–1.</em></h2>
    <PreviewAuthor slug="conrad-deshaun-watson-cleveland-hope"/>
    <p className="standfirst">A column on Browns fandom, quarterback play, and the moral tension created by winning.</p>
    <div className="read">READ CONRAD SORRELL →</div>
  </Link>
</section>
<section className="hero heroStack" aria-label="Featured Hollis Crane investigation">
  <Link className="hero-copy storylink" href={root+"/articles/hollis-jameis-winston-turing-test"}>
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.58),rgba(0,0,0,.08)),url('/images/editorial/jameis-winston.webp')",backgroundPosition:"center 34%"}}>
      <div><small>HOLLIS CRANE • INVESTIGATIONS</small><b>THE JAMEIS WINSTON TURING TEST</b></div>
    </div>
    <div className="eyebrow">INVESTIGATIONS • PERSONHOOD & INTELLIGENCE</div>
    <h2>The Jameis Winston <em>Turing Test.</em></h2>
    <PreviewAuthor slug="hollis-jameis-winston-turing-test"/>
    <p className="standfirst">After a decade of motivational philosophy, recursive metaphors and sentences that sound important without technically containing information, Jameis Winston has become an unexpectedly interesting case study in intelligence.</p>
    <div className="read">READ HOLLIS CRANE →</div>
  </Link>
</section>
<section className="morningBriefPreview sundayFront" aria-label="On Assignment: Sabine March in Rio de Janeiro">
  <div className="morningBriefFlag"><span>ON ASSIGNMENT</span><small>SABINE MARCH • RIO DE JANEIRO • SEPTEMBER 27</small></div>
  <div className="sundayFrontGrid">
    <article className="sundayFeature sabinePackage">
      <Link href={root+"/articles/sabine-sunday-maracana"} className="sundayFeatureImage sundayActionHero storylink"><ResilientImage loading="lazy" decoding="async" src="/images/editorial/maracana-stadium.webp" alt="Interior of the Maracanã stadium in Rio de Janeiro"/><div className="actionCaption"><small>SABINE MARCH • RIO DE JANEIRO</small><b>SUNDAY DISPATCH</b></div></Link>
      <div className="sundayFeatureCopy">
        <div className="sabinePackageIntro"><small>SABINE MARCH • SOCIETY & SPECIAL CORRESPONDENCE</small><Link href={root+"/articles/sabine-sunday-maracana"} className="sabinePackageTitle storylink"><h2>Sunday at the Maracanã</h2></Link><p>Everybody wants the stadium. The grass has begun to object.</p><PreviewAuthor slug="sabine-sunday-maracana"/></div>
        <div className="sabineInlineVideo">
          <div className="sabineVideoLabel"><small><span className="sabineDesktopLabel">ON ASSIGNMENT • RIO DE JANEIRO</span><span className="sabineMobileLabel">FROM RIO</span></small><span>0:28</span></div>
          <div className="sabineVideoBody">
            <video controls playsInline preload="none" poster="https://cdn.openart.ai/openart/thumbnail/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465571680_924949be.webp" src="https://cdn.openart.ai/openart-ai/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465560812_7dd1af7e.mp4"/>
          </div>
        </div>
        <Link href={root+"/articles/sabine-sunday-maracana"} className="sabinePackageCta">READ THE DISPATCH →</Link>
      </div>
    </article>

  </div>
</section>
<section className="hero heroStack" aria-label="Featured culture column">
  <Link className="hero-copy storylink" href={root+"/articles/marnie-manifest-destiny-wembley"}>
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.52),rgba(0,0,0,.06)),url('/images/editorial/wembley-fans.webp')",backgroundPosition:"center 42%"}}>
      <div><small>MARNIE KELLS • CULTURE</small><b>MANIFEST DESTINY</b></div>
    </div>
    <div className="eyebrow">MATTERS OF CULTURE • AMERICAN EXPORTS</div>
    <h2>Manifest Destiny Has Reached <em>the Jubilee Line.</em></h2>
    <PreviewAuthor slug="marnie-manifest-destiny-wembley"/>
    <p className="standfirst">America sent 15,000 fans, marching bands, cheerleaders, an electric-guitar anthem and a fake Britain to Britain. Wembley never had a chance.</p>
    <div className="read">READ MARNIE KELLS →</div>
  </Link>
</section>



<div className={styles.archiveCta}>
  <div><span className={styles.label}>THE PERMANENT RECORD</span><p>Every take. Every receipt.</p></div>
  <Link className={styles.link} href={archiveHref}>BROWSE THE ARCHIVE <span aria-hidden="true">→</span></Link>
</div>
  </>;
}
