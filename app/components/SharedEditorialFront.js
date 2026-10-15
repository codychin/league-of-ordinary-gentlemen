import {imageSrc,imageBackground} from '../../lib/editorial-images';
import Link from 'next/link';
import styles from './ArchiveCta.module.css';
import front from './SharedEditorialFront.module.css';
import ArticleClip from './ArticleClip';
import PreviewAuthor from './PreviewAuthor';
import ResilientImage from './ResilientImage';

// Keep correspondent/theme labels mandatory for shared homepage story imagery.
// Theme copy adds a specific supporting angle or curiosity gap; never repeat the
// headline/dek or spoil the article's closing joke. Keep it brief enough for mobile.
function ImageLabel({byline,theme}){
  return <div className="actionCaption"><small>{byline}</small><b>{theme}</b></div>;
}

export default function SharedEditorialFront({archiveHref='/archive',root=''}){
  return <>
<section className="morningBriefPreview sundayFront" style={{paddingTop:0}} aria-label="Lead story: And You Are?">
  <div className="morningBriefFlag"><span>MATTERS OF CULTURE</span><small>SABINE MARCH • OCTOBER 14</small></div>
  <div className="sundayFrontGrid"><article className="sundayFeature sabinePackage">
    <Link href={root+"/articles/sabine-and-you-are"} className={`sundayFeatureImage storylink ${front.tourHero}`}>
      <ResilientImage loading="eager" decoding="async" style={{objectPosition:"center center"}} src="/images/and-you-are/evans.jpg" alt="Mike Evans checks Trevon Diggs’s nameplate."/>
      <ImageLabel byline="SABINE MARCH • SOCIETY" theme="FAME MEETS A SELECTIVE MEMORY"/>
    </Link>
    <div className="sundayFeatureCopy"><div className="sabinePackageIntro">
      <small>INTERNATIONAL & PUBLIC LIFE</small>
      <Link href={root+"/articles/sabine-and-you-are"} className="sabinePackageTitle storylink"><h2>And You Are?</h2></Link>
      <p>Ten great moments in the sporting art of withholding recognition.</p>
      <PreviewAuthor slug="sabine-and-you-are"/>
    </div><div className="sabineInlineVideo"><div className="sabineVideoLabel"><small>SABINE MARCH • AT THE SCENE</small><span>0:28</span></div><div className="sabineVideoBody" style={{aspectRatio:"16/9"}}><video controls playsInline preload="none" aria-label="Sabine March: And You Are?" poster={imageSrc('https://cdn.openart.ai/openart/thumbnail/production/2026-10/create-video/TLTpmJfydK54x1UaTK6G/cgt-20261015011317-nyzdt_1791998392667_75bad0dd.webp',640)} src="https://cdn.openart.ai/openart-ai/production/2026-10/create-video/TLTpmJfydK54x1UaTK6G/cgt-20261015011317-nyzdt_1791998386490_f0ad425c.mp4" style={{objectFit:"cover",objectPosition:"center 30%"}}/></div></div><Link href={root+"/articles/sabine-and-you-are"} className="sabinePackageCta">READ SABINE →</Link></div>
  </article></div>
</section>

<section className={front.recent} aria-label="Recent stories">
<article className={front.card} aria-label="Hollis Crane on the Rams kicker swap"><Link className={front.story} href={root+"/articles/hollis-rams-kicker-weight"}><div className={front.image} role="img" aria-label="Blake Grupe kicks a football for New Orleans" style={{backgroundImage:imageBackground('https://static.clubs.nfl.com/image/upload/t_editorial_landscape_12_desktop/saints/m2jfru6egwyvkpypfj8r',640),backgroundPosition:"center 40%"}}><ImageLabel byline="HOLLIS CRANE • INVESTIGATIONS" theme="A CONSIDERABLE REDUCTION IN PERSONNEL"/></div><div className="eyebrow">THE FOOTBALL DESK • PERSONNEL</div><h3>The Rams Have Lost 89 Pounds at Kicker</h3><PreviewAuthor slug="hollis-rams-kicker-weight"/><p className={front.dek}>The NFL's largest kicker is out. One of its smallest has arrived. The equipment department has been given quite a lot of room.</p><div className="read">READ HOLLIS →</div></Link></article>

<article className={front.card} aria-label="Maude Gannon on the NFC East"><Link className={front.story} href={root+"/articles/maude-nfc-east-declines-winner"}><div className={front.image} role="img" aria-label="Giants defenders celebrate the tie with Washington." style={{backgroundImage:`${imageBackground('https://sportshub.cbsistatic.com/i/r/2026/10/11/830be0b3-3807-40dd-b003-6e64d0d49615/thumbnail/1200x675/7fba8e6037ce9a83e03b456a120f5a57/commanders-giants.jpg',640)}`}}><ImageLabel byline="MAUDE GANNON • FOOTBALL" theme="A WINNING KICK, NEVER ATTEMPTED"/></div><div className="eyebrow">THE FOOTBALL DESK</div><h3>The NFC East Declines to Name a Winner</h3><PreviewAuthor slug="maude-nfc-east-declines-winner"/><p className={front.dek}>The Giants and Commanders spent the afternoon reducing the requirements for victory. Neither could meet the final version.</p><div className="read">READ MAUDE →</div></Link></article>
<article className={front.card} aria-label="Marnie Kells on Marvin Harrison Jr."><Link className={front.story} href={root+"/articles/marnie-marvin-harrison-somewhere-else"}><div className={front.image} role="img" aria-label="Marvin Harrison Jr. catching a football in his white Arizona Cardinals No. 18 uniform." style={{backgroundImage:`${imageBackground('https://static.clubs.nfl.com/image/upload/t_editorial_landscape_12_desktop/cardinals/whbhqzxotle5uja93jv1',640)}`,backgroundPosition:"left center"}}><ImageLabel byline="MARNIE KELLS • CULTURE" theme="FOURTH OVERALL. FORWARDING ADDRESS PENDING."/></div><div className="eyebrow">MATTERS OF CULTURE • SPORTING LIFE</div><h3>Marvin Harrison Jr. Will Be Playing Somewhere Else. The Important Part Is Else.</h3><PreviewAuthor slug="marnie-marvin-harrison-somewhere-else"/><p className={front.dek}>The destination remains unreported. The departure has received considerably more clarity.</p><div className="read">READ MARNIE →</div></Link></article>







</section>
<section className="hero heroStack" aria-label="Marnie Kells on Jeremy Hecklinski">
  <Link className="hero-copy storylink" href={root+"/articles/marnie-hecklinski-use-your-words"}>
    <div className="photoHero" style={{backgroundImage:imageBackground('https://images2.minutemediacdn.com/image/upload/c_crop%2Cx_0%2Cy_275%2Cw_4659%2Ch_2620/c_fill%2Cw_1440%2Car_1440%3A810%2Cf_auto%2Cq_auto%2Cg_auto/images/ImagnImages/mmsport/inside_the_hawkeyes/01kt4afzsc00k8hwtpfv.jpg',900),backgroundPosition:"center 27%"}}><div><small>MARNIE KELLS • CULTURE</small><b>ONE QUARTERBACK REACHES HIS EMOTIONAL LIMIT</b></div></div>
    <div className="eyebrow">MATTERS OF CULTURE • INTERPERSONAL COMMUNICATION</div>
    <h2>Use Your Words.</h2>
    <PreviewAuthor slug="marnie-hecklinski-use-your-words"/>
    <p className="standfirst">An Iowa quarterback and the quiet courage of asking for what you need.</p>
    <div className="read">READ MARNIE →</div>
  </Link>
</section>

<section className="hero heroStack" aria-label="Marnie Kells on the Time-Traveling Goblin Paradox"><Link className="hero-copy storylink" href={root+"/articles/marnie-time-traveling-goblin-paradox"}><div className="eyebrow">MATTERS OF CULTURE • TEMPORAL STUDIES</div><h2>The Time-Traveling Goblin Paradox</h2><PreviewAuthor slug="marnie-time-traveling-goblin-paradox"/><div className="photoHero" style={{backgroundImage:`${imageBackground('https://i.kym-cdn.com/entries/icons/facebook/000/057/575/tiptoeing.jpg',640)}`,backgroundPosition:"center"}}><ImageLabel byline="MARNIE KELLS • CULTURE" theme="RIFF RAFF WAS TWELVE YEARS EARLY"/></div><p className="standfirst">A brief inquiry into Riff Raff, the Year of the Horse and an event that has begun occurring retroactively.</p><div className="read">READ MARNIE →</div></Link></section>
<section className="hero heroStack" aria-label="Conrad Sorrell on Mike Tomlin">
  <Link className="hero-copy storylink" href={root+"/articles/conrad-tomlin-minecraft-cvs"}>
    <div className="photoHero" style={{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.52),rgba(0,0,0,.08)),${imageBackground('/images/editorial/tomlin-minecraft-city.jpg',640)}`,backgroundPosition:"center"}}>
      <ImageLabel byline="CONRAD SORRELL • COLUMN" theme="TWELVE YEARS BUILDING A PLACE THAT LISTENS"/>
    </div>
    <div className="eyebrow">COLUMN • POWER & AMERICAN ARRANGEMENTS</div>
    <h2>In a World Without Scarcity, Mike Tomlin Built a CVS</h2>
    <PreviewAuthor slug="conrad-tomlin-minecraft-cvs"/>
    <p className="standfirst">An architectural tour of a civilization where anything is possible and the pharmacy is conveniently located.</p>
    <div className="read">READ CONRAD →</div>
  </Link>
</section>
<section className="hero heroStack" aria-label="Marnie Kells on the corgi race">
  <Link className="hero-copy storylink" href={root+"/articles/marnie-corgi-he-wanted-them-to-know"}>
    <div className="photoHero" style={{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.52),rgba(0,0,0,.08)),${imageBackground('/images/editorial/corgi-look-back-bw.png',640)}`,backgroundPosition:"center"}}>
      <ImageLabel byline="MARNIE KELLS • CULTURE" theme="THE HALFTIME RACE BECOMES PSYCHOLOGICAL WARFARE"/>
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
    <div className="photoHero" style={{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.58),rgba(0,0,0,.08)),${imageBackground('https://img.ksl.com/slc/3198/319896/31989626.jpg?filter=kslv2%2Fresponsive_story_lg&v=1787444404',640)}`,backgroundPosition:"center 34%"}}>
      <ImageLabel byline="CONRAD SORRELL • COLUMN" theme="WHAT WINNING DOES TO A FAN’S CONSCIENCE"/>
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
    <div className="photoHero" style={{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.58),rgba(0,0,0,.08)),${imageBackground('/images/editorial/jameis-winston.webp',640)}`,backgroundPosition:"center 34%"}}>
      <ImageLabel byline="HOLLIS CRANE • INVESTIGATIONS" theme="THE WORDS SOUND IMPORTANT. DO THEY MEAN ANYTHING?"/>
    </div>
    <div className="eyebrow">INVESTIGATIONS • PERSONHOOD & INTELLIGENCE</div>
    <h2>The Jameis Winston <em>Turing Test.</em></h2>
    <PreviewAuthor slug="hollis-jameis-winston-turing-test"/>
    <p className="standfirst">After a decade of motivational philosophy, recursive metaphors and sentences that sound important without technically containing information, Jameis Winston has become an unexpectedly interesting case study in intelligence.</p>
    <div className="read">READ HOLLIS CRANE →</div>
  </Link>
</section>





<section className="morningBriefPreview sundayFront" style={{paddingTop:0}} aria-label="On Assignment: Dashiell Pike in London">
  <div className="morningBriefFlag"><span>ON ASSIGNMENT</span><small>DASHIELL PIKE • LONDON • OCTOBER 7</small></div>
  <div className="sundayFrontGrid">
    <article className="sundayFeature sabinePackage">
      <Link href={root+"/articles/dashiell-jaguars-london-future"} className={`sundayFeatureImage storylink ${front.tourHero}`}>
        <ResilientImage loading="eager" decoding="async" style={{objectPosition:"center 42%"}} src="/api/dashiell-london-fans-image" alt="NFL fans gathered in London for an international game."/>
        <ImageLabel byline="DASHIELL PIKE • LONDON" theme="TWO HOME MARKETS. ONE VERY STRANGE FRANCHISE."/>
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
            <video controls playsInline preload="none" poster={imageSrc('https://cdn.openart.ai/openart/thumbnail/production/2026-10/create-video/TLTpmJfydK54x1UaTK6G/cgt-20261008002242-mexhp_1791390729765_82dc1525.webp',640)} src="https://cdn.openart.ai/openart-ai/production/2026-10/create-video/TLTpmJfydK54x1UaTK6G/cgt-20261008002242-mexhp_1791390692996_b5b0afba.mp4"/>
          </div>
        </div>
        <Link href={root+"/articles/dashiell-jaguars-london-future"} className="sabinePackageCta">READ THE DISPATCH →</Link>
      </div>
    </article>
  </div>
</section>

<div className={styles.archiveCta}>
  <div><span className={styles.label}>THE PERMANENT RECORD</span><p>Every take. Every receipt.</p></div>
  <Link className={styles.link} href={archiveHref}>BROWSE THE ARCHIVE <span aria-hidden="true">→</span></Link>
</div>
  </>;
}
