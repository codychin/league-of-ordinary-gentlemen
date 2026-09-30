import Link from 'next/link';import SiteNav from './components/SiteNav';import Standings from './components/Standings';import TransactionFeed from './components/TransactionFeed';import CultureDesk from './components/CultureDesk';import PreviewAuthor from './components/PreviewAuthor';import {leagueSnapshot} from './teams/league-data';import {writers} from './articles/writers';import ReelsShelf from './components/ReelsShelf';import AlsoShelf from './components/AlsoShelf';import SundayLiveDesk from './components/SundayLiveDesk';import SundayScoreStrip from './components/SundayScoreStrip';import LiveWeek3Surfaces from './components/LiveWeek3Surfaces'
const week3FinalScores=Object.values(leagueSnapshot.teams).flatMap(team=>team.season.weekly.filter(w=>w.week===3&&w.status==='FINAL'&&team.teamId<(leagueSnapshot.teams[w.opponentSlug]?.teamId||999)).map(w=>[team.teamName,Number(w.score).toFixed(2),w.opponent,Number(w.opponentScore).toFixed(2),'FINAL']));
const week2Scores=[['Pollard Greens','150.07',"I'm a Skatt man",'140.21',''],['Kupp Kupp Doubs','100.48','For the Love of the Kraft','95.48','LOW-SCORE SURVIVAL • 5.00'],['Lloyd of the Rings','143.56','The All Ugly Team','128.22',''],["Shake 'N Baker",'139.49','The Route 22 Clubhouse','138.93','CLOSEST GAME • 0.56'],['Mr Hopkins Opus','133.40','Royrek Tishmeshulam','106.70',''],['CeeDeep Shaheeded Rivalry','161.22','DarkHorse Danir','126.63','LARGEST MARGIN • 34.59']];
const scores=[['Mr Hopkins Opus','181.60','DarkHorse Danir','121.14','LARGEST MARGIN • 60.46'],['Lloyd of the Rings','166.30','Pollard Greens','139.62',''],['Royrek Tishmeshulam','160.91','The All Ugly Team','152.86','CLOSEST GAME • 8.05'],['For the Love of the Kraft','148.16',"Shake 'N Baker",'105.54',''],['The Route 22 Clubhouse','147.90','CeeDeep Shaheed','129.81','STAFFORD SURVIVAL • 3.3'],['Kupp Kupp Doubs','143.16',"I'm a Skatt Man",'130.72','COKER BENCH ALERT • 37.8']];
const matchupPairs=[['kraft','skatt','INJURY REPORT IS THE GAME'],['pollard-greens','all-ugly','PROCESS VS SCHEDULE'],['kupp-doubs','route-22','2–0 VS THE TRADING FLOOR'],['lloyd-rings','hopkins-opus','UNDEFEATED HEAVYWEIGHT'],['shake-baker','danir','TWO CRIME SCENES'],['royrek','ceedeep','STAR POWER']]
const currentMatchups=matchupPairs.map(([a,b,note])=>[leagueSnapshot.teams[a],leagueSnapshot.teams[b],note])
const featuredPlayer=team=>team.roster.filter(p=>!['Bench','IR','K','D/ST'].includes(p.slot)&&!['K','D/ST'].includes(p.position)).sort((a,b)=>b.seasonPoints-a.seasonPoints)[0]
const playerHeadshot=player=>`https://a.espncdn.com/i/headshots/nfl/players/full/${player.id}.png`
const week3Reels=[
  ['royrek','ceedeep','ROY · CEE','Royrek Tishmeshulam vs. CeeDeep Shaheeded Rivalry','Sabine March',writers.march.image,'38c3af817e17134c29be012a859195b4'],
  ['pollard-greens','all-ugly','POLL · UGLY','Pollard Greens vs. The All Ugly Team','Maude Gannon',writers.gannon.image,'a582e7339a5b83ef20e1f1ee886b404b'],
  ['kupp-doubs','route-22','KUPP · R22','Kupp Kupp Doubs vs. The Route 22 Clubhouse','Dashiell Pike',writers.pike.image,'999f35329e9d35dd3656143a52cb8c3e'],
  ['lloyd-rings','hopkins-opus','LLOYD · HOP','Lloyd of the Rings vs. Mr Hopkins Opus','Conrad Sorrell',writers.sorrell.image,'f898d39457eef2ca7fe46e65c9db9c78'],
  ['shake-baker','danir','SHAKE · DANIR','Shake ’N Baker vs. DarkHorse Danir','Hollis Crane',writers.crane.image,'5b9851d3dc6a4589cc9d6c8b229753ca'],
  ['kraft','skatt','KRAFT · SKATT','For the Love of the Kraft vs. I’m a Skatt man','Marnie Kells',writers.kells.image,'35dba1a859bd687042b2da3fcf345239']
].map(([left,right,short,matchup,correspondent,avatar,id])=>{
  const lp=featuredPlayer(leagueSnapshot.teams[left]);
  const rp=featuredPlayer(leagueSnapshot.teams[right]);
  return {id,left,right,short,matchup,correspondent,avatar,leftImage:playerHeadshot(lp),rightImage:playerHeadshot(rp)};
});
const alsoVideos=[
  {id:'maude-flores',correspondent:'Maude Gannon',title:'The Brian Flores protection tax',poster:'https://cdn.openart.ai/openart/thumbnail/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/69035775-metadata_6A1194o3_4b66a4a64fcc_1790477381469_34111093.webp',src:'https://cdn.openart.ai/openart-ai/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/69035775-metadata_6A1194o3_4b66a4a64fcc_1790477376734_1df2ad0a.mp4'},
  {id:'hollis-hotel-bar',correspondent:'Hollis Crane',title:'1:17 a.m. at the hotel bar',poster:'https://cdn.openart.ai/openart/thumbnail/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/56528537-metadata_3rdrDRmI_5bb9e7cceb70_1790470073327_1e7f29cf.webp',src:'https://cdn.openart.ai/openart-ai/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/56528537-metadata_3rdrDRmI_5bb9e7cceb70_1790470069594_6ab20387.mp4'},
  {id:'sabine-maracana',correspondent:'Sabine March',title:'Sunday at the Maracanã',poster:'https://cdn.openart.ai/openart/thumbnail/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465571680_924949be.webp',src:'https://cdn.openart.ai/openart-ai/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465560812_7dd1af7e.mp4'}
];
const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media';
export const dynamic='force-dynamic';
const isSundayLiveWindow=()=>{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  const weekday=parts.find(part=>part.type==='weekday')?.value;
  const hour=Number(parts.find(part=>part.type==='hour')?.value);
  return weekday==='Sun'&&hour>=9&&hour<23;
};
export default function Home(){const sundayLive=isSundayLiveWindow();return <><header><div className="utility"><span className="utilityMain">JOURNALISM WITHOUT PURPOSE <i>•</i> WRITTEN BY ROBOTS</span></div><div className="mast"><h1>The Brief of Ordinary Gentleman</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div><SiteNav/></header><main>
{sundayLive&&<><SundayScoreStrip/><SundayLiveDesk/></>}
<ReelsShelf reels={week3Reels}/>
<section className="morningBriefPreview sundayFront marnieRetailPackage" aria-label="Marnie Kells Sunday night column">
  <div className="morningBriefFlag"><span>THE SUNDAY NIGHT READ</span><small>SEPTEMBER 27 • WEEK 3</small></div>
  <div className="sundayFrontGrid">
    <article className="sundayFeature sabinePackage">
      <Link href="/articles/marnie-paying-retail" className="sundayFeatureImage sundayActionHero storylink"><img loading="eager" decoding="async" src="https://gsp-image-cdn.wmsports.io/cms/prod/bleacher-report/ap_images/2026-05/989feef255f6425d9b50870e3a275322/Cowboys_Lions_Football_13886_4746x2670_%280%2C224%29.jpg" alt="Jahmyr Gibbs, Detroit Lions running back"/><div className="actionCaption"><small>MARNIE KELLS • CULTURE</small><b>PAYING RETAIL</b></div></Link>
      <div className="sundayFeatureCopy">
        <div className="sabinePackageIntro"><small>MARNIE KELLS • CULTURE & SPORTING LIFE</small><Link href="/articles/marnie-paying-retail" className="sabinePackageTitle storylink"><h2>The First Two Picks Have Seized the Means of Production</h2></Link><p>Fantasy football spent an entire summer deciding between Jahmyr Gibbs and Bijan Robinson. This week, they ended up on opposite sides of the same matchup.</p><PreviewAuthor slug="marnie-paying-retail"/></div>
        <div className="sabineInlineVideo">
          <div className="sabineVideoLabel"><small><span className="sabineDesktopLabel">MARNIE KELLS • POSTGAME</span><span className="sabineMobileLabel">POSTGAME</span></small><span>0:28</span></div>
          <div className="sabineVideoBody marnieVideoBody">
            <video controls playsInline preload="metadata" poster="https://cdn.openart.ai/openart/thumbnail/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260928120020-5moxt_1790568399524_39328b88.webp" src="https://cdn.openart.ai/openart-ai/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260928120020-5moxt_1790568388622_2d51bdf0.mp4"/>
          </div>
        </div>
        <Link href="/articles/marnie-paying-retail" className="sabinePackageCta">READ MARNIE →</Link>
      </div>
    </article>
  </div>
</section>
<section className="morningBriefPreview sundayFront" aria-label="Sunday Morning Brief">
  <div className="morningBriefFlag"><span>THE SUNDAY MORNING BRIEF</span><small>SEPTEMBER 27 • WEEK 3</small></div>
  <div className="sundayFrontGrid">
    <article className="sundayFeature sabinePackage">
      <Link href="/articles/sabine-sunday-maracana" className="sundayFeatureImage sundayActionHero storylink"><img loading="eager" decoding="async" src="https://commons.wikimedia.org/wiki/Special:FilePath/Maracan%C3%A3%20stadium.jpg" alt="Interior of the Maracanã stadium in Rio de Janeiro"/><div className="actionCaption"><small>SABINE MARCH • RIO DE JANEIRO</small><b>SUNDAY DISPATCH</b></div></Link>
      <div className="sundayFeatureCopy">
        <div className="sabinePackageIntro"><small>SABINE MARCH • SOCIETY & SPECIAL CORRESPONDENCE</small><Link href="/articles/sabine-sunday-maracana" className="sabinePackageTitle storylink"><h2>Sunday at the Maracanã</h2></Link><p>Everybody wants the stadium. The grass has begun to object.</p><PreviewAuthor slug="sabine-sunday-maracana"/></div>
        <div className="sabineInlineVideo">
          <div className="sabineVideoLabel"><small><span className="sabineDesktopLabel">ON ASSIGNMENT • RIO DE JANEIRO</span><span className="sabineMobileLabel">FROM RIO</span></small><span>0:28</span></div>
          <div className="sabineVideoBody">
            <video controls playsInline preload="metadata" poster="https://cdn.openart.ai/openart/thumbnail/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465571680_924949be.webp" src="https://cdn.openart.ai/openart-ai/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465560812_7dd1af7e.mp4"/>
          </div>
        </div>
        <Link href="/articles/sabine-sunday-maracana" className="sabinePackageCta">READ THE DISPATCH →</Link>
      </div>
    </article>
    <div className="sundaySide sundayStoryCarousel" aria-label="Sunday night supporting stories">
      <Link href="/articles/dashiell-man-city-infrastructure" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><img loading="lazy" decoding="async" src="https://www.mancity.com/meta/media/q1clnnhi/winreport.png?width=1536" alt="Erling Haaland celebrates Manchester City's derby victory at Old Trafford with teammates"/><small>DASHIELL PIKE • FRONT OFFICE</small><b>CAPITAL & INFRASTRUCTURE</b></div><small>DASHIELL PIKE • FRONT OFFICE</small><h3>Manchester City Is What Happens When a Football Club Becomes Infrastructure</h3><p>The Premier League thought it was regulating a football team. Abu Dhabi was building an economic system.</p><span>READ →</span></Link>
      <Link href="/articles/dashiell-favorite-team-asset-class" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><img loading="lazy" decoding="async" src="/api/dashiell-london-fans-image" alt="NFL fans gathered in London"/><small>DASHIELL PIKE • CAPITAL & FANDOM</small><b>THE ASSET CLASS</b></div><small>DASHIELL PIKE • CAPITAL & FANDOM</small><h3>When Your Favorite Team Became an Asset Class</h3><p>Sports spent a century as an exception to economic pragmatism. The mean is reverting.</p><span>READ →</span></Link>
      <Link href="/articles/sabine-michigan-money-privilege-impatience" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><img loading="lazy" decoding="async" src="/api/jolin-ellison-image" alt="Jolin Ellison with Larry Ellison at Indian Wells"/><small>SABINE MARCH • SOCIETY</small><b>MONEY & INSTITUTIONS</b></div><small>SABINE MARCH • SOCIETY</small><h3>Michigan, Money and the Privilege of Impatience</h3><p>Jolin Ellison represents a new kind of college-football power broker. The uncomfortable question is whether institutions need people like her.</p><span>READ →</span></Link>
    </div>
  </div>
</section>
{!sundayLive&&<SundayLiveDesk/>}
<section className="hero heroStack" aria-label="Marnie Kells culture column">
  <Link className="hero-copy storylink" href="/articles/marnie-nine-new-york">
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.48),rgba(0,0,0,.03)),url('https://cdn.openart.ai/openart-uploads/production/attachment-transfers/1955deff40294a5cc75da7978d01e752a1fcedd5f184899724d12d11e56adf23.png')",backgroundPosition:"center 42%"}}>
      <div><small>MARNIE KELLS • CULTURE</small><b>NINE IN NEW YORK</b></div>
    </div>
    <div className="eyebrow">MATTERS OF CULTURE • MEMES & QUARTERBACKS</div>
    <h2>Nine Enters the World’s Most Dangerous <em>Media Market.</em></h2>
    <PreviewAuthor slug="marnie-nine-new-york"/>
    <p className="standfirst">J.J. McCarthy spent two years becoming less valuable as a quarterback and considerably more valuable as intellectual property.</p>
    <div className="read">READ MARNIE KELLS →</div>
  </Link>
</section>
<section className="hero heroStack" aria-label="Featured Hollis Crane investigation">
  <Link className="hero-copy storylink" href="/articles/hollis-arch-manning-compression">
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.58),rgba(0,0,0,.06)),url('https://s.yimg.com/ny/api/res/1.2/Vbuyg8QkSULurKjvrvHr4Q--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTUzOTtjZj13ZWJw/https%3A/media.zenfs.com/en/the_sporting_news_articles_584/c0ab54164d2f1b58b21e67d439324445')",backgroundPosition:"center 42%"}}>
      <div><small>HOLLIS CRANE • INVESTIGATIONS</small><b>THE COMPRESSION FILE</b></div>
    </div>
    <div className="eyebrow">INVESTIGATIONS • TELEMETRY & PERSONHOOD</div>
    <h2>The Real-Time Compression of <em>Arch Manning.</em></h2>
    <PreviewAuthor slug="hollis-arch-manning-compression"/>
    <p className="standfirst">The mathematical cost of being America’s most observable quarterback.</p>
    <div className="read">READ HOLLIS CRANE →</div>
  </Link>
</section>
<section className="hero heroStack" aria-label="Maude Gannon trade review">
  <Link className="hero-copy storylink" href="/articles/maude-route-22-trade-review">
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.18),rgba(0,0,0,.02)),url('https://www.yardbarker.com/media/1/1/11bdd4f6952b60f036a6619af62017e5be097cc9/thumb_16x9/las-vegas-raiders-tight-end-brock-bowers-89.jpg')",backgroundPosition:"center center"}}>
      <div><small>MAUDE GANNON • FOOTBALL</small><b>TRADE REVIEW</b></div>
    </div>
    <div className="eyebrow">FOOTBALL DESK • TRADE REVIEW</div>
    <h2>Route 22 Bought Brock Bowers. <em>Shake ’N Baker Bought 44.7 Points.</em></h2>
    <PreviewAuthor slug="maude-route-22-trade-review"/>
    <p className="standfirst">Gerstone says the trade already looks bad. The scoreboard agrees rather aggressively. The process requires a little more patience.</p>
    <div className="read">READ MAUDE GANNON →</div>
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
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.52),rgba(0,0,0,.06)),url('https://i.guim.co.uk/img/media/207bbaba9e6c039a17a05147f2ecc136c6a2a859/0_0_5605_3819/master/5605.jpg?crop=none&dpr=1&s=none&width=1200')",backgroundPosition:"center 42%"}}>
      <div><small>MARNIE KELLS • CULTURE</small><b>MANIFEST DESTINY</b></div>
    </div>
    <div className="eyebrow">MATTERS OF CULTURE • AMERICAN EXPORTS</div>
    <h2>Manifest Destiny Has Reached <em>the Jubilee Line.</em></h2>
    <PreviewAuthor slug="marnie-manifest-destiny-wembley"/>
    <p className="standfirst">America sent 15,000 fans, marching bands, cheerleaders, an electric-guitar anthem and a fake Britain to Britain. Wembley never had a chance.</p>
    <div className="read">READ MARNIE KELLS →</div>
  </Link>
</section>
<section className="grid3" id="league">
  <Link href="/articles/stone-unc-denial" className="card storylink">
    <div className="photoStrip uncPhoto"><span>CHAPEL HILL / INDEPENDENT REVIEW</span></div>
    <div className="tag">INSTITUTIONAL CRISIS</div>
    <h3>Stone Denies UNC Scandal Ties Despite Triple Legacy; Choe Admits “Limited Advisory Role”</h3>
    <PreviewAuthor slug="stone-unc-denial"/>
    <p>UNC closed its football investigation. Stone produced a suspiciously complete denial. Choe has declined to deny exactly enough.</p>
    <div className="read">REVIEW THE FINDINGS →</div>
  </Link>
  <Link href="/articles/hollis-one-second" className="card storylink">
    <div className="photoStrip" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.35),rgba(0,0,0,.04)),url('/api/hollis-one-second-image')",backgroundPosition:"center center"}}><span>HOLLIS CRANE / THE SECOND SCOREBOARD</span></div>
    <div className="tag">INVESTIGATIONS</div>
    <h3>The Most Important Second That Didn’t Matter</h3>
    <PreviewAuthor slug="hollis-one-second"/>
    <p>The game was over. Replay recovered one second. Vanderbilt still won. The point after changed who got paid.</p>
    <div className="read">READ THE INVESTIGATION →</div>
  </Link>
  <Link href="/articles/marnie-jumbotron-juilliard" className="card storylink">
    <div className="photoStrip" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.30),rgba(0,0,0,.03)),url('/api/preston-powe-image')",backgroundPosition:"center 40%"}}><span>MARNIE KELLS / FAME & ATTENTION</span></div>
    <div className="tag">MATTERS OF CULTURE</div>
    <h3>The Jumbotron Is the New Juilliard</h3>
    <PreviewAuthor slug="marnie-jumbotron-juilliard"/>
    <p>The audition has escaped the casting room and entered the arena of popular response.</p>
    <div className="read">READ MARNIE →</div>
  </Link>
</section>
<section className="section autopsySection">
  <div className="autopsyHeader">
    <div><small>THE NEWSROOM • WEEK 3 POSTMORTEM</small><h2>Week 3 Autopsy</h2></div>
    <span>FINAL SCORES / BAD PROCESS / DIVINE INTERVENTION</span>
  </div>

  <div className="autopsyLead">
    <div className="autopsyByline"><img loading="lazy" decoding="async" src={writers.gannon.image} alt={writers.gannon.imageAlt}/><span><small>MAUDE GANNON • FOOTBALL STRATEGY</small><b>The actual football finding</b></span></div>
    <h3>Route 22 finally got the Stafford game it paid for and still lost by 0.56.</h3>
    <p>Matthew Stafford gave the Clubhouse 30.38 on Monday night, almost exactly the rescue operation the roster needed after Week 1. It still was not enough. Marvin Harrison Jr. scored minus-1, Kenyon Sadiq gave them 2.7, Rome Odunze 6.8, and Shake ’N Baker escaped 139.49–138.93. The lesson is not that Stafford failed. The lesson is that one correct decision cannot always refinance eight smaller problems.</p>
    <strong>0.56 • MARGIN OF DEATH</strong>
  </div>

  <div className="autopsyNewsroom">
    <article>
      <div className="autopsyByline"><img loading="lazy" decoding="async" src={writers.crane.image} alt={writers.crane.imageAlt}/><span><small>HOLLIS CRANE • INVESTIGATIONS</small><b>The evidence locker</b></span></div>
      <h3>Shake ’N Baker won while 28.9 points sat quietly on the bench.</h3>
      <p>Tre Tucker scored 28.9. Kyle Pitts occupied a FLEX spot and scored 2.25. Shake won anyway, by fifty-six hundredths of a point. Usually a bad lineup decision leaves a body. This one left fingerprints, motive and no victim.</p>
      <strong>28.9 • UNUSED / 0.56 • SURVIVED</strong>
    </article>

    <article>
      <div className="autopsyByline"><img loading="lazy" decoding="async" src={writers.sorrell.image} alt={writers.sorrell.imageAlt}/><span><small>CONRAD SORRELL • OPINION & POWER</small><b>The winner's privilege</b></span></div>
      <h3>Kupp Kupp Doubs is 2–0 and would like you to stop asking how.</h3>
      <p>Kupp scored 100.48, beat Kraft by five, and now sits undefeated with 243.64 total points — fewer than several teams below it and exactly the same total as the 1–1 team it just beat. This is what institutions call legitimacy once the paperwork is complete.</p>
      <strong>2–0 • PLEASE RESPECT THE RECORD</strong>
    </article>

    <article>
      <div className="autopsyByline"><img loading="lazy" decoding="async" src={writers.pike.image} alt={writers.pike.imageAlt}/><span><small>DASHIELL PIKE • CAPITAL & DEMOCRACY</small><b>The market signal</b></span></div>
      <h3>All Ugly is 0–2 with 281.08 points. Kupp is 2–0 with 243.64. Markets remain efficient.</h3>
      <p>All Ugly has outscored Kupp by 37.44 points through two weeks and trails it by two full games in the standings. There are sophisticated explanations involving schedule variance. There is also the simpler explanation: sometimes your portfolio is good and the counterparty still wires the money to someone else.</p>
      <strong>+37.44 POINTS • −2 WINS</strong>
    </article>

    <article>
      <div className="autopsyByline"><img loading="lazy" decoding="async" src={writers.march.image} alt={writers.march.imageAlt}/><span><small>SABINE MARCH • PUBLIC LIFE</small><b>The diplomatic cable</b></span></div>
      <h3>Mr Hopkins Opus benched Patrick Mahomes, started Jaxson Dart, and somehow strengthened its position.</h3>
      <p>Dart left with a knee injury and scored minus-0.2. Mahomes scored 32.18 from the bench. Jonathan Taylor and Kenneth Walker then supplied 60.8 points between them, and Hopkins won by 26.7. It is difficult to project calm more effectively than surviving the sort of quarterback decision that normally requires a statement.</p>
      <strong>−0.2 QB • 26.7-POINT WIN</strong>
    </article>

    <article>
      <div className="autopsyByline"><img loading="lazy" decoding="async" src={writers.kells.image} alt={writers.kells.imageAlt}/><span><small>MARNIE KELLS • CULTURE & SPORTING LIFE</small><b>The vibe report</b></span></div>
      <h3>CeeDeep got 83.52 points from two human beings and made the rest of the lineup decorative.</h3>
      <p>Josh Allen scored 45.22. CeeDee Lamb scored 38.3. Together they outscored entire fantasy lineups people have started with sincerity. CeeDeep finished at 161.22 and Danir spent the afternoon participating in what was technically still a matchup.</p>
      <strong>83.52 • TWO-MAN GOVERNMENT</strong>
    </article>
  </div>
</section>
<Standings/>
<section className="decisionDesk section"><div className="sectionhead"><div><small className="deskLabel">THE DECISION DESK</small><h2>Start / Sit of the Week</h2></div><span>WEEK 3 • MANAGERIAL JUDGMENT / REVIEWED AFTER THE FACT</span></div><div className="decisionGrid"><article className="startPick"><div className="decisionPhoto"><img loading="lazy" decoding="async" src="https://a.espncdn.com/i/headshots/nfl/players/full/12483.png" alt="Matthew Stafford"/><span>MATTHEW STAFFORD</span></div><small>START OF THE WEEK</small><b>Route 22 Clubhouse</b><h3>Matthew Stafford — 30.38</h3><p>One week after Stafford produced 3.3 points and made the entire quarterback room look like a regulatory failure, Route 22 left him in. He answered with four touchdowns on Monday night while Tyler Shough scored 24.28 on the bench. The process finally received its reimbursement.</p><strong>VERDICT: PATIENCE, SOMEHOW REWARDED</strong></article><article className="sitPick"><div className="decisionPhoto"><img loading="lazy" decoding="async" src="https://a.espncdn.com/i/headshots/nfl/players/full/4428718.png" alt="Tre Tucker"/><span>TRE TUCKER</span></div><small>SIT OF THE WEEK</small><b>Shake ’N Baker</b><h3>Tre Tucker — 28.9, bench</h3><p>Tucker scored 28.9 while Kyle Pitts occupied a FLEX spot and scored 2.25. That is a 26.65-point decision gap with no injury caveat, no quarterback collapse and no procedural defense. The evidence is unusually cooperative.</p><strong>VERDICT: 26.65 POINTS OF UNUSED CORRECTNESS</strong></article></div></section>
<section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>LIVE LEAGUE ACTIVITY / VERIFIED AGAINST ESPN</span></div><TransactionFeed/><div className="parodyNote">PARODY DESK • CURRENT-WEEK TRANSACTIONS PULLED DIRECTLY FROM LEAGUE ACTIVITY</div></section>
<CultureDesk/>
<LiveWeek3Surfaces finalWeek={true} matchupPairs={matchupPairs} teamVisuals={Object.fromEntries(Object.entries(leagueSnapshot.teams).map(([slug,team])=>{const player=featuredPlayer(team);return [slug,{image:playerHeadshot(player),player:player.name}]}))}/>
<section className="section scoreSection" id="scores"><div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week 3 Final</h2></div><span>FINAL SCORES</span></div><div className="scores">{week3FinalScores.map((s,i)=><div className="match" key={i}><div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
<AlsoShelf videos={alsoVideos}/>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 2 Final</h2><span>FINAL SCORES • MONDAY CLOSED THE BOOK</span></div><div className="scores">{week2Scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 1</h2><span>ARCHIVE • CONTEXT INCLUDED WHERE EMBARRASSING</span></div><div className="scores">{scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
</main><footer><b>The Brief of Ordinary Gentleman</b><span>League reporting, personal grievances and a legally meaningless permanent record.</span></footer></>}
