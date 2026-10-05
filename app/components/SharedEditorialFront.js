import Link from 'next/link';
import styles from './ArchiveCta.module.css';
import ArticleClip from './ArticleClip';
import PreviewAuthor from './PreviewAuthor';
import ResilientImage from './ResilientImage';

export default function SharedEditorialFront({archiveHref='/archive'}){
  return <>
<section className="morningBriefPreview sundayFront" style={{paddingTop:0}} aria-label="Lead story: Marnie Kells on the corgi race">
  <div className="morningBriefFlag"><span>THE LEAD STORY</span><small>OCTOBER 4 • MARNIE KELLS</small></div>
  <div className="sundayFrontGrid">
    <article className="sundayFeature sabinePackage">
      <Link href="/articles/marnie-corgi-he-wanted-them-to-know" className="sundayFeatureImage sundayActionHero storylink">
        <ResilientImage loading="eager" decoding="async" src="/images/editorial/corgi-look-back-bw.png" alt="A leading corgi looks back at two trailing competitors, in black and white"/>
        <div className="actionCaption"><small>MARNIE KELLS • CULTURE</small><b>HE WANTED THEM TO KNOW HE KNEW</b></div>
      </Link>
      <div className="sundayFeatureCopy">
        <div className="sabinePackageIntro">
          <small>MATTERS OF CULTURE</small>
          <Link href="/articles/marnie-corgi-he-wanted-them-to-know" className="sabinePackageTitle storylink"><h2>He Wanted Them to Know He Knew.</h2></Link>
          <p>Winning the corgi race was insufficient. He needed witnesses.</p>
          <PreviewAuthor slug="marnie-corgi-he-wanted-them-to-know"/>
        </div>
        <Link href="/articles/marnie-corgi-he-wanted-them-to-know" className="sabinePackageCta">READ MARNIE →</Link>
      </div>
    </article>
  </div>
</section>

<section className="hero heroStack" aria-label="Marnie Kells on Tee Higgins">
  <Link className="hero-copy storylink" href="/articles/marnie-tee-higgins-ankles">
    <div className="eyebrow">MATTERS OF CULTURE • IN MEMORIAM • OCTOBER 4</div>
    <h2>Tee Higgins’ Ankles Have Asked to Be Buried Separately</h2>
    <PreviewAuthor slug="marnie-tee-higgins-ankles"/>
    <p className="standfirst">The family is contesting Travis Hunter’s appointment as executor.</p>
    <div className="read">READ MARNIE</div>
  </Link>
  <ArticleClip tweetId="2106801789630919072" url="https://x.com/fballforeverhq/status/2106801789630919072" showCaption={false}/>
</section>

<section className="hero heroStack" aria-label="Featured Conrad Sorrell column">
  <Link className="hero-copy storylink" href="/articles/conrad-deshaun-watson-cleveland-hope">
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
  <Link className="hero-copy storylink" href="/articles/hollis-jameis-winston-turing-test">
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
<section className="morningBriefPreview sundayFront" aria-label="Sunday Morning Brief">
  <div className="morningBriefFlag"><span>THE SUNDAY MORNING BRIEF</span><small>SEPTEMBER 27 • WEEK 3</small></div>
  <div className="sundayFrontGrid">
    <article className="sundayFeature sabinePackage">
      <Link href="/articles/sabine-sunday-maracana" className="sundayFeatureImage sundayActionHero storylink"><ResilientImage loading="lazy" decoding="async" src="/images/editorial/maracana-stadium.webp" alt="Interior of the Maracanã stadium in Rio de Janeiro"/><div className="actionCaption"><small>SABINE MARCH • RIO DE JANEIRO</small><b>SUNDAY DISPATCH</b></div></Link>
      <div className="sundayFeatureCopy">
        <div className="sabinePackageIntro"><small>SABINE MARCH • SOCIETY & SPECIAL CORRESPONDENCE</small><Link href="/articles/sabine-sunday-maracana" className="sabinePackageTitle storylink"><h2>Sunday at the Maracanã</h2></Link><p>Everybody wants the stadium. The grass has begun to object.</p><PreviewAuthor slug="sabine-sunday-maracana"/></div>
        <div className="sabineInlineVideo">
          <div className="sabineVideoLabel"><small><span className="sabineDesktopLabel">ON ASSIGNMENT • RIO DE JANEIRO</span><span className="sabineMobileLabel">FROM RIO</span></small><span>0:28</span></div>
          <div className="sabineVideoBody">
            <video controls playsInline preload="none" poster="https://cdn.openart.ai/openart/thumbnail/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465571680_924949be.webp" src="https://cdn.openart.ai/openart-ai/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465560812_7dd1af7e.mp4"/>
          </div>
        </div>
        <Link href="/articles/sabine-sunday-maracana" className="sabinePackageCta">READ THE DISPATCH →</Link>
      </div>
    </article>
    <div className="sundaySide sundayStoryCarousel" aria-label="Sunday night supporting stories">
      <Link href="/articles/dashiell-man-city-infrastructure" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><ResilientImage loading="lazy" decoding="async" src="/images/editorial/man-city-derby.webp" alt="Erling Haaland celebrates Manchester City's derby victory at Old Trafford with teammates"/><small>DASHIELL PIKE • FRONT OFFICE</small><b>CAPITAL & INFRASTRUCTURE</b></div><small>DASHIELL PIKE • FRONT OFFICE</small><h3>Manchester City Is What Happens When a Football Club Becomes Infrastructure</h3><p>The Premier League thought it was regulating a football team. Abu Dhabi was building an economic system.</p><span>READ →</span></Link>
      <Link href="/articles/dashiell-favorite-team-asset-class" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><ResilientImage loading="lazy" decoding="async" src="/api/dashiell-london-fans-image" alt="NFL fans gathered in London"/><small>DASHIELL PIKE • CAPITAL & FANDOM</small><b>THE ASSET CLASS</b></div><small>DASHIELL PIKE • CAPITAL & FANDOM</small><h3>When Your Favorite Team Became an Asset Class</h3><p>Sports spent a century as an exception to economic pragmatism. The mean is reverting.</p><span>READ →</span></Link>
      <Link href="/articles/sabine-michigan-money-privilege-impatience" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><ResilientImage loading="lazy" decoding="async" src="/api/jolin-ellison-image" alt="Jolin Ellison with Larry Ellison at Indian Wells"/><small>SABINE MARCH • SOCIETY</small><b>MONEY & INSTITUTIONS</b></div><small>SABINE MARCH • SOCIETY</small><h3>Michigan, Money and the Privilege of Impatience</h3><p>Jolin Ellison represents a new kind of college-football power broker. The uncomfortable question is whether institutions need people like her.</p><span>READ →</span></Link>
    </div>
  </div>
</section>
<section className="hero heroStack" aria-label="Featured Hollis Crane investigation">
  <Link className="hero-copy storylink" href="/articles/hollis-arch-manning-compression">
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.58),rgba(0,0,0,.06)),url('/api/hollis-arch-manning-image')",backgroundPosition:"center 42%"}}>
      <div><small>HOLLIS CRANE • INVESTIGATIONS</small><b>THE COMPRESSION FILE</b></div>
    </div>
    <div className="eyebrow">INVESTIGATIONS • TELEMETRY & PERSONHOOD</div>
    <h2>The Real-Time Compression of <em>Arch Manning.</em></h2>
    <PreviewAuthor slug="hollis-arch-manning-compression"/>
    <p className="standfirst">The mathematical cost of being America’s most observable quarterback.</p>
    <div className="read">READ HOLLIS CRANE →</div>
  </Link>
</section>
<section className="hero heroStack" aria-label="Featured Conrad Sorrell column">
  <Link className="hero-copy storylink" href="/articles/conrad-caleb-williams-survived">
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.58),rgba(0,0,0,.10)),url('/api/caleb-williams-image')",backgroundPosition:"center 36%"}}>
      <div><small>CONRAD SORRELL • OPINION & POWER</small><b>THE DRAMATIC INJURY INDEX</b></div>
    </div>
    <div className="eyebrow">COLUMN • POWER & AMERICAN ARRANGEMENTS</div>
    <h2>Caleb Williams <em>Survived.</em></h2>
    <PreviewAuthor slug="conrad-caleb-williams-survived"/>
    <p className="standfirst">Chicago’s quarterback left Soldier Field like a wounded general. By Monday, the Bears had not even ruled him out for next week.</p>
    <div className="read">READ CONRAD SORRELL →</div>
  </Link>
</section>
<section className="hero heroStack" aria-label="Featured culture column">
  <Link className="hero-copy storylink" href="/articles/marnie-manifest-destiny-wembley">
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
