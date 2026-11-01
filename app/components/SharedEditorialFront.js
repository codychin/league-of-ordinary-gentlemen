import {imageSrc,imageBackground} from '../../lib/editorial-images';
import Link from 'next/link';
import styles from './ArchiveCta.module.css';
import front from './SharedEditorialFront.module.css';
import PreviewAuthor from './PreviewAuthor';
import {jayZArticle} from '../articles/conrad-allow-me-to-reintroduce-myself';
import ResilientImage from './ResilientImage';

// Lead/card thumbnail: same embedded interview at 6.333529s, cropped only; original article hero retained.
// Keep correspondent/theme labels mandatory for shared homepage story imagery.
// Theme copy adds a specific supporting angle or curiosity gap; never repeat the
// headline/dek or spoil the article's closing joke. Keep it brief enough for mobile.
function ImageLabel({byline,theme}){
  return <div className="actionCaption"><small>{byline}</small><b>{theme}</b></div>;
}

export default function SharedEditorialFront({archiveHref='/archive',root=''}){
  return <>
<section className="morningBriefPreview sundayFront immersiveLead" data-editorial-system="a" data-editorial-layout="open-top" style={{paddingTop:0}} aria-label="Lead story: A Study in Movement: The Detroit School, 2026"><div className="sundayFrontGrid"><article className="sundayFeature sabinePackage"><Link href={root+"/articles/marnie-detroit-school"} className={`sundayFeatureImage storylink ${front.tourHero}`}><ResilientImage loading="eager" decoding="async" src="/images/editorial/detroit-school/homepage-gibbs-dance.webp" style={{objectFit:"cover",objectPosition:"center top"}} alt="Detroit Lions teammates celebrate together on the field."/></Link><div className="sundayFeatureCopy"><div className="sabinePackageIntro"><small>MATTERS OF CULTURE • ART HISTORY</small><Link href={root+"/articles/marnie-detroit-school"} className="sabinePackageTitle storylink"><h2>A Study in Movement: The Detroit School, 2026</h2></Link><PreviewAuthor slug="marnie-detroit-school" date="OCTOBER 26"/><p className={front.leadDek}>On the spontaneous birth of an artistic movement, and the evolution of human expression.</p></div></div></article></div></section>

<section className={front.recent} data-editorial-system="a" aria-label="Recent stories">
<article className={front.card} aria-label="Maude Gannon on Daniel Jones"><Link className={front.story} href={root+"/articles/maude-saturation-bombing-daniel-jones"}><div className={front.image} role="img" aria-label="Dallas Turner and a Vikings teammate sack Daniel Jones." style={{backgroundImage:imageBackground('https://static.clubs.nfl.com/image/upload/t_new_photo_album/f_auto/vikings/kv8vl4woo5h0q5asdhm3.jpg',640),backgroundPosition:"center",backgroundSize:"contain",backgroundRepeat:"no-repeat",backgroundColor:"#111"}}><ImageLabel byline="MAUDE GANNON • FOOTBALL" theme="85.2 PERCENT"/></div><div className="eyebrow">FOOTBALL • STRATEGY &amp; BAD PROCESS</div><h3>On the Saturation Bombing of Daniel Jones (née Dimes)</h3><PreviewAuthor slug="maude-saturation-bombing-daniel-jones"/><p className={`${front.dek} editorialDeck`}>How Brian Flores declined all pleas for a ceasefire and continued carpet-blitzing the shit out of the Colts.</p></Link></article>

<article className={front.card} aria-label="Conrad Sorrell on Jay-Z"><Link className={front.story} href={root+"/articles/conrad-allow-me-to-reintroduce-myself"}><div className={front.image} role="img" aria-label="Jay-Z at the Shawn Carter Foundation Carnival in 2011." style={{backgroundImage:imageBackground('/images/editorial/jay-z-lead.webp',640),backgroundPosition:jayZArticle.imageObjectPosition}}><ImageLabel byline="CONRAD SORRELL • COLUMN" theme="AN EXCELLENT CANDIDATE"/></div><div className="eyebrow">COLUMN • POWER & AMERICAN ARRANGEMENTS</div><h3>Allow Me to Reintroduce Myself</h3><PreviewAuthor slug="conrad-allow-me-to-reintroduce-myself"/><p className={`${front.dek} editorialDeck`}>Finding someone equal to the occasion is easier when you consider yourself the occasion.</p></Link></article>

<article className={front.card} aria-label="Marnie Kells on sporting etiquette"><Link className={front.story} href={root+"/articles/marnie-delicate-etiquette-sporting-pat"}><div className={front.image} role="img" aria-label="Josh Allen speaks with Tracy Wolfson during a postgame interview." style={{backgroundImage:imageBackground('/images/editorial/allen-wolfson-interview-thumbnail.jpg',640),backgroundPosition:"center"}}><ImageLabel byline="MARNIE KELLS • CULTURE" theme="GOOD INTENTIONS"/></div><div className="eyebrow">MATTERS OF CULTURE • SPORTING LIFE</div><h3>The Delicate Etiquette of a Sporting Pat</h3><PreviewAuthor slug="marnie-delicate-etiquette-sporting-pat"/><p className={`${front.dek} editorialDeck`}>Encouragement from an era with fewer follow-up questions.</p></Link></article>




</section>
<section className="hero heroStack" data-editorial-system="a" aria-label="Conrad Sorrell on medical clearance"><Link className="hero-copy storylink" href={root+"/articles/conrad-jalen-hurts-too-sick-to-sleep"}><div className="photoHero" role="img" aria-label="Philadelphia Eagles quarterback Jalen Hurts" style={{backgroundImage:imageBackground('https://static.www.nfl.com/image/upload/t_editorial_landscape_12_desktop/league/yvnjwaq0gvfpmx7hmatz',640),backgroundPosition:"center 30%"}}><ImageLabel byline="CONRAD SORRELL • COLUMN" theme="WHEN MEDICAL CLEARANCE BECOMES NEGOTIABLE"/></div><div className="eyebrow">COLUMN • POWER & AMERICAN ARRANGEMENTS</div><h2>The Medical Clearance Industrial Complex</h2><PreviewAuthor slug="conrad-jalen-hurts-too-sick-to-sleep"/><p className="standfirst">Thirty-six hours without sleep. A blood clot. And somehow, a starting quarterback.</p></Link></section>
<section className="hero heroStack" data-editorial-system="a" aria-label="Hollis Crane on the Rams kicker swap"><Link className="hero-copy storylink" href={root+"/articles/hollis-rams-kicker-weight"}><div className="photoHero" role="img" aria-label="Blake Grupe kicks a football for New Orleans" style={{backgroundImage:imageBackground('https://static.clubs.nfl.com/image/upload/t_editorial_landscape_12_desktop/saints/m2jfru6egwyvkpypfj8r',640),backgroundPosition:"center 40%"}}><ImageLabel byline="HOLLIS CRANE • INVESTIGATIONS" theme="A CONSIDERABLE REDUCTION IN PERSONNEL"/></div><div className="eyebrow">THE FOOTBALL DESK • PERSONNEL</div><h2>The Rams Have Lost 89 Pounds at Kicker</h2><PreviewAuthor slug="hollis-rams-kicker-weight"/><p className="standfirst">The NFL's largest kicker is out. One of its smallest has arrived. The equipment department has been given quite a lot of room.</p></Link></section>
<div className="mobileLowerCarousel" aria-label="More editorial stories">
<section className="hero heroStack" data-editorial-system="a" aria-label="Maude Gannon on the NFC East"><Link className="hero-copy storylink" href={root+"/articles/maude-nfc-east-declines-winner"}><div className="photoHero" role="img" aria-label="Giants defenders celebrate the tie with Washington." style={{backgroundImage:`${imageBackground('https://sportshub.cbsistatic.com/i/r/2026/10/11/830be0b3-3807-40dd-b003-6e64d0d49615/thumbnail/1200x675/7fba8e6037ce9a83e03b456a120f5a57/commanders-giants.jpg',640)}`}}><ImageLabel byline="MAUDE GANNON • FOOTBALL" theme="A WINNING KICK, NEVER ATTEMPTED"/></div><div className="eyebrow">THE FOOTBALL DESK</div><h2>The NFC East Declines to Name a Winner</h2><PreviewAuthor slug="maude-nfc-east-declines-winner"/><p className="standfirst">The Giants and Commanders spent the afternoon reducing the requirements for victory. Neither could meet the final version.</p></Link></section>

<section className="hero heroStack" data-editorial-system="a" aria-label="Sabine March on recognition"><Link className="hero-copy storylink" href={root+"/articles/sabine-and-you-are"}><div className="photoHero" style={{backgroundImage:imageBackground('/images/and-you-are/evans.jpg',640),backgroundPosition:"center"}}><ImageLabel byline="SABINE MARCH • SOCIETY" theme="FAME MEETS A SELECTIVE MEMORY"/></div><div className="eyebrow">INTERNATIONAL & PUBLIC LIFE</div><h2>And You Are?</h2><PreviewAuthor slug="sabine-and-you-are"/><p className="standfirst">Ten great moments in the sporting art of withholding recognition.</p></Link></section>
<section className="hero heroStack" data-editorial-system="a" aria-label="Marnie Kells on Marvin Harrison Jr."><Link className="hero-copy storylink" href={root+"/articles/marnie-marvin-harrison-somewhere-else"}><div className="photoHero" style={{backgroundImage:imageBackground('https://static.clubs.nfl.com/image/upload/t_editorial_landscape_12_desktop/cardinals/whbhqzxotle5uja93jv1',640),backgroundPosition:"left center"}}><ImageLabel byline="MARNIE KELLS • CULTURE" theme="FOURTH OVERALL. FORWARDING ADDRESS PENDING."/></div><div className="eyebrow">MATTERS OF CULTURE • SPORTING LIFE</div><h2>Marvin Harrison Jr. Will Be Playing Somewhere Else. The Important Part Is Else.</h2><PreviewAuthor slug="marnie-marvin-harrison-somewhere-else"/><p className="standfirst">The destination remains unreported. The departure has received considerably more clarity.</p></Link></section>
</div>
<div className="mobileStoryRows" aria-label="Further reading">
<section className="hero heroStack" data-editorial-system="a" aria-label="Marnie Kells on Jeremy Hecklinski">
  <Link className="hero-copy storylink" href={root+"/articles/marnie-hecklinski-use-your-words"}>
    <div className="photoHero" style={{backgroundImage:imageBackground('https://images2.minutemediacdn.com/image/upload/c_crop%2Cx_0%2Cy_275%2Cw_4659%2Ch_2620/c_fill%2Cw_1440%2Car_1440%3A810%2Cf_auto%2Cq_auto%2Cg_auto/images/ImagnImages/mmsport/inside_the_hawkeyes/01kt4afzsc00k8hwtpfv.jpg',900),backgroundPosition:"center 27%"}}><div><small>MARNIE KELLS • CULTURE</small><b>ONE QUARTERBACK REACHES HIS EMOTIONAL LIMIT</b></div></div>
    <div className="eyebrow">MATTERS OF CULTURE • INTERPERSONAL COMMUNICATION</div>
    <h2>Use Your Words.</h2>
    <PreviewAuthor slug="marnie-hecklinski-use-your-words"/>
    <p className="standfirst">An Iowa quarterback and the quiet courage of asking for what you need.</p>

  </Link>
</section>

<section className="hero heroStack" data-editorial-system="a" aria-label="Marnie Kells on the Time-Traveling Goblin Paradox"><Link className="hero-copy storylink" href={root+"/articles/marnie-time-traveling-goblin-paradox"}><div className="photoHero" style={{backgroundImage:`${imageBackground('https://i.kym-cdn.com/entries/icons/facebook/000/057/575/tiptoeing.jpg',640)}`,backgroundPosition:"center"}}><ImageLabel byline="MARNIE KELLS • CULTURE" theme="RIFF RAFF WAS TWELVE YEARS EARLY"/></div><div className="eyebrow">MATTERS OF CULTURE • TEMPORAL STUDIES</div><h2>The Time-Traveling Goblin Paradox</h2><PreviewAuthor slug="marnie-time-traveling-goblin-paradox"/><p className="standfirst">A brief inquiry into Riff Raff, the Year of the Horse and an event that has begun occurring retroactively.</p></Link></section>
<section className="hero heroStack" data-editorial-system="a" aria-label="Conrad Sorrell on Mike Tomlin">
  <Link className="hero-copy storylink" href={root+"/articles/conrad-tomlin-minecraft-cvs"}>
    <div className="photoHero" style={{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.52),rgba(0,0,0,.08)),${imageBackground('/images/editorial/tomlin-minecraft-city.jpg',640)}`,backgroundPosition:"center"}}>
      <ImageLabel byline="CONRAD SORRELL • COLUMN" theme="TWELVE YEARS BUILDING A PLACE THAT LISTENS"/>
    </div>
    <div className="eyebrow">COLUMN • POWER & AMERICAN ARRANGEMENTS</div>
    <h2>In a World Without Scarcity, Mike Tomlin Built a CVS</h2>
    <PreviewAuthor slug="conrad-tomlin-minecraft-cvs"/>
    <p className="standfirst">An architectural tour of a civilization where anything is possible and the pharmacy is conveniently located.</p>

  </Link>
</section>
<section className="hero heroStack" data-editorial-system="a" aria-label="Marnie Kells on the corgi race">
  <Link className="hero-copy storylink" href={root+"/articles/marnie-corgi-he-wanted-them-to-know"}>
    <div className="photoHero" style={{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.52),rgba(0,0,0,.08)),${imageBackground('/images/editorial/corgi-look-back-bw.png',640)}`,backgroundPosition:"center"}}>
      <ImageLabel byline="MARNIE KELLS • CULTURE" theme="THE HALFTIME RACE BECOMES PSYCHOLOGICAL WARFARE"/>
    </div>
    <div className="eyebrow">MATTERS OF CULTURE • SPORTING LIFE</div>
    <h2>He Wanted Them to Know He Knew.</h2>
    <PreviewAuthor slug="marnie-corgi-he-wanted-them-to-know"/>
    <p className="standfirst">Winning the corgi race was insufficient. He needed witnesses.</p>

  </Link>
</section>







<section className="morningBriefPreview sundayFront" data-editorial-system="a" style={{paddingTop:0}} aria-label="On Assignment: Dashiell Pike in London">
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
          <PreviewAuthor slug="dashiell-jaguars-london-future"/>
          <p>The Jacksonville Jaguars spent years looking like an NFL problem to be solved. In London, they may have accidentally become something else.</p>
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

</div>
<div className={styles.archiveCta}>
  <div><span className={styles.label}>THE PERMANENT RECORD</span><p>Every take. Every receipt.</p></div>
  <Link className={styles.link} href={archiveHref}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 7h18v14H3zM3 7l3-4h12l3 4M7 11h10M7 15h10"/></svg>DIG INTO THE CRATES <span aria-hidden="true">→</span></Link>
</div>
  </>;
}
