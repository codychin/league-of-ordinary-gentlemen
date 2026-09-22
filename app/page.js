import Link from 'next/link';import SiteNav from './components/SiteNav';import Standings from './components/Standings';import TransactionLedger from './components/TransactionLedger';import CultureDesk from './components/CultureDesk';import PreviewAuthor from './components/PreviewAuthor';import {leagueSnapshot} from './teams/league-data';import {writers} from './articles/writers'
const scores=[['Mr Hopkins Opus','181.60','DarkHorse Danir','121.14','LARGEST MARGIN • 60.46'],['Lloyd of the Rings','166.30','Pollard Greens','139.62',''],['Royrek Tishmeshulam','160.91','The All Ugly Team','152.86','CLOSEST GAME • 8.05'],['For the Love of the Kraft','148.16',"Shake 'N Baker",'105.54',''],['The Route 22 Clubhouse','147.90','CeeDeep Shaheed','129.81','STAFFORD SURVIVAL • 3.3'],['Kupp Kupp Doubs','143.16',"I'm a Skatt Man",'130.72','COKER BENCH ALERT • 37.8']];
const matchupPairs=[['skatt','pollard-greens','COIN FLIP'],['kraft','kupp-doubs',''],['all-ugly','lloyd-rings','FAMILY BUSINESS'],['route-22','shake-baker','PHONES EXPECTED TO REMAIN OPEN'],['hopkins-opus','royrek','KASH HAS NEW EVIDENCE'],['danir','ceedeep','REHABILITATION OPPORTUNITY']]
const currentMatchups=matchupPairs.map(([a,b,note])=>[leagueSnapshot.teams[a],leagueSnapshot.teams[b],note])
const featuredPlayer=team=>team.roster.filter(p=>!['Bench','IR','K','D/ST'].includes(p.slot)&&!['K','D/ST'].includes(p.position)).sort((a,b)=>b.seasonPoints-a.seasonPoints)[0]
const playerHeadshot=player=>`https://a.espncdn.com/i/headshots/nfl/players/full/${player.id}.png`
const schefter=[['SEP 17','🚨 BREAKING: Mr Hopkins Opus has added WR Demarcus Robinson for $0 and released RB George Holani, per the ESPN transaction record. The Holani era lasted approximately one business day.','31','84','917','61K'],['SEP 17','🚨 WAIVER: DarkHorse Danir has acquired RB Rachaad White for $2 and dropped WR Malik Washington. White joins a bench currently operating under independent oversight.','44','103','1.2K','77K'],['SEP 16','🚨 BREAKING: All Ugly is adding RB Demond Claiborne for $0, per league sources. The move comes with Jordan Mason on IR and carries what one executive described as “limited financial downside.”','22','68','743','52K'],['SEP 16','🚨 BREAKING: Route 22 remains active on the trade market, sources tell The Brief. Choe and Gerstone have sent multiple proposals since Monday; at least three teams have already declined. The phones remain open.','91','214','2.1K','198K']];
const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media';
export default function Home(){return <><header><div className="utility"><span className="utilityMain">JOURNALISM WITHOUT PURPOSE <i>•</i> WRITTEN BY ROBOTS</span></div><div className="mast"><h1>The Brief of Ordinary Gentleman</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div><SiteNav/></header><main>
<section className="morningBriefPreview sundayFront" aria-label="Monday Morning Brief">
  <div className="morningBriefFlag"><span>THE MONDAY MORNING BRIEF</span><small>SEPTEMBER 21 • WEEK 2</small></div>
  <div className="sundayFrontGrid">
    <Link href="/articles/maude-rams-without-puka" className="sundayFeature storylink">
      <div className="sundayFeatureImage sundayActionHero"><img src="https://www.yardbarker.com/media/c/c/cc9f0645a7b1f7c596e4a1ce14754ecb4694cb06/thumb_16x9/01k6kncnk9aq66q75ndz.jpg" alt="Davante Adams celebrating in a Los Angeles Rams uniform"/><div className="actionCaption"><small>MAUDE GANNON • FOOTBALL</small><b>MONDAY NIGHT WRAP</b></div></div>
      <div className="sundayFeatureCopy"><small>MAUDE GANNON • FILM & FANTASY</small><h2>The Rams Didn’t Just Beat the Giants. They Showed Us What Their Offense Looks Like Without Puka.</h2><p>Davante Adams became the center of gravity, Los Angeles kept scoring, and one Monday night moved five assets inside the League of Ordinary Gentlemen.</p><PreviewAuthor slug="maude-rams-without-puka"/><span>READ MAUDE’S MONDAY NIGHT WRAP →</span></div>
    </Link>
    <div className="sundaySide sundayStoryCarousel" aria-label="Sunday night supporting stories">
      <Link href="/articles/maude-jayden-daniels-elbow" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><img src="/api/jayden-daniels-image" alt="Jayden Daniels running against the Dallas Cowboys"/><small>MAUDE GANNON • FOOTBALL</small><b>INJURY FILE</b></div><small>MAUDE GANNON • FOOTBALL</small><h3>Jayden Daniels Has Dislocated the Same Elbow Twice in 10 Months</h3><p>The initial X-rays show no fracture. The recurrence is still the part nobody can make sound normal.</p><span>READ →</span></Link>
      <Link href="/articles/marnie-tilly-cantonese" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><img src="https://i.ytimg.com/vi/x4yyBWkYSHs/maxresdefault.jpg" alt="Piers Morgan interviewing AI-generated actress Tilly Norwood"/><small>MARNIE KELLS • CULTURE</small><b>MACHINE RELATIONS</b></div><small>MARNIE KELLS • CULTURE</small><h3>Hollywood’s AI Actress Glitched Into Cantonese and Continued the Press Tour</h3><p>The publication written by robots has requested everyone remain calm.</p><span>READ →</span></Link>
      <Link href="/articles/hollis-uprights-reality" className="sundaySideStory storylink"><div className="sideImage sundaySecondaryAction"><img src="/api/uprights-image?v=2" alt="A field goal attempt at Gillette Stadium"/><small>HOLLIS CRANE • INVESTIGATIONS</small><b>OPTICAL GOVERNANCE</b></div><small>HOLLIS CRANE • INVESTIGATIONS</small><h3>The NFL Has Standardized Reality Behind the Uprights</h3><p>A new league rule says both teams must now inhabit the same visual universe during field goals.</p><span>READ →</span></Link>
    </div>
  </div>
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
<section className="hero heroStack hollisSecondScoreboardFeature" aria-label="Featured investigation">
  <Link className="hero-copy storylink" href="/articles/hollis-one-second">
    <div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.50),rgba(0,0,0,.08)),url('/api/hollis-one-second-image')",backgroundPosition:"center center"}}>
      <div><small>HOLLIS CRANE • INVESTIGATIONS</small><b>THE SECOND SCOREBOARD</b></div>
    </div>
    <div className="eyebrow">INVESTIGATIONS • THE SECOND SCOREBOARD</div>
    <h2>The Most Important Second <em>That Didn’t Matter.</em></h2>
    <PreviewAuthor slug="hollis-one-second"/>
    <p className="standfirst">The game was over. Replay recovered one second. Vanderbilt still won. The point after changed who got paid.</p>
    <div className="read">READ THE INVESTIGATION →</div>
  </Link>
</section>
<section className="hero heroStack" id="league"><Link className="hero-copy storylink" href="/articles/sabine-chest-statement"><div className="photoHero" style={{backgroundImage:"linear-gradient(0deg,rgba(0,0,0,.38),rgba(0,0,0,.06)),url('/api/sabine-march.jpg')",backgroundPosition:"center 20%"}}><div><small>SABINE MARCH • PUBLIC LIFE</small><b>A BRIEF STATEMENT</b></div></div><div className="eyebrow">MATTERS OF CULTURE • PUBLIC LIFE</div><h2>A Brief Statement Regarding <em>Ongoing Chest Speculation.</em></h2><PreviewAuthor slug="sabine-chest-statement"/><p className="standfirst">Sabine declines to provide measurements, commission an independent review, or deny the central allegation.</p><div className="read">READ THE STATEMENT →</div></Link></section>
<section className="grid3"><Link href="/articles/stone-unc-denial" className="card storylink"><div className="photoStrip uncPhoto"><span>CHAPEL HILL / INDEPENDENT REVIEW</span></div><div className="tag">INSTITUTIONAL CRISIS</div><h3>Stone Denies UNC Scandal Ties Despite Triple Legacy; Choe Admits “Limited Advisory Role”</h3><PreviewAuthor slug="stone-unc-denial"/><p>UNC closed its football investigation. Stone produced a suspiciously complete denial. Choe has declined to deny exactly enough.</p><div className="read">REVIEW THE FINDINGS →</div></Link><Link href="/articles/danir-emergency-jobs-program" className="card storylink"><div className="photoStrip danirJobsPhoto"><span>DARKHORSE DANIR / WORKFORCE DEVELOPMENT</span></div><div className="tag">TRANSACTIONS & LABOR</div><h3>DarkHorse Danir Announces Emergency Jobs Program for Underemployed Wide Receivers</h3><PreviewAuthor slug="danir-emergency-jobs-program"/><p>Nailor. Saylors. Washington. Wicks. White. One failed Vele claim. September employment remains strong.</p><div className="read">VISIT THE EMPLOYMENT OFFICE →</div></Link><Link href="/articles/danir-bench-crime" className="card storylink"><div className="photoStrip purdyPhoto"><span>PURDY + MONANGAI / 52.0 BENCH POINTS</span></div><div className="tag">LINEUP CRIMES UNIT</div><h3>Danir Left a Functional Quarterback and 29.4-Point Running Back on the Bench</h3><PreviewAuthor slug="danir-bench-crime"/><p>Bo Nix scored 4.74. Brock Purdy scored 22.6. Kyle Monangai scored 29.4. The prosecution would like to rest.</p><div className="read">REVIEW THE CRIME SCENE →</div></Link></section>
<section className="section autopsySection">
  <div className="autopsyHeader">
    <div><small>THE NEWSROOM • WEEK 2 POSTMORTEM</small><h2>Week 2 Autopsy</h2></div>
    <span>FINAL SCORES / BAD PROCESS / DIVINE INTERVENTION</span>
  </div>

  <div className="autopsyLead">
    <div className="autopsyByline"><img src={writers.gannon.image} alt={writers.gannon.imageAlt}/><span><small>MAUDE GANNON • FOOTBALL STRATEGY</small><b>The actual football finding</b></span></div>
    <h3>Route 22 finally got the Stafford game it paid for and still lost by 0.56.</h3>
    <p>Matthew Stafford gave the Clubhouse 30.38 on Monday night, almost exactly the rescue operation the roster needed after Week 1. It still was not enough. Marvin Harrison Jr. scored minus-1, Kenyon Sadiq gave them 2.7, Rome Odunze 6.8, and Shake ’N Baker escaped 139.49–138.93. The lesson is not that Stafford failed. The lesson is that one correct decision cannot always refinance eight smaller problems.</p>
    <strong>0.56 • MARGIN OF DEATH</strong>
  </div>

  <div className="autopsyNewsroom">
    <article>
      <div className="autopsyByline"><img src={writers.crane.image} alt={writers.crane.imageAlt}/><span><small>HOLLIS CRANE • INVESTIGATIONS</small><b>The evidence locker</b></span></div>
      <h3>Shake ’N Baker won while 28.9 points sat quietly on the bench.</h3>
      <p>Tre Tucker scored 28.9. Kyle Pitts occupied a FLEX spot and scored 2.25. Shake won anyway, by fifty-six hundredths of a point. Usually a bad lineup decision leaves a body. This one left fingerprints, motive and no victim.</p>
      <strong>28.9 • UNUSED / 0.56 • SURVIVED</strong>
    </article>

    <article>
      <div className="autopsyByline"><img src={writers.sorrell.image} alt={writers.sorrell.imageAlt}/><span><small>CONRAD SORRELL • OPINION & POWER</small><b>The winner's privilege</b></span></div>
      <h3>Kupp Kupp Doubs is 2–0 and would like you to stop asking how.</h3>
      <p>Kupp scored 100.48, beat Kraft by five, and now sits undefeated with 243.64 total points — fewer than several teams below it and exactly the same total as the 1–1 team it just beat. This is what institutions call legitimacy once the paperwork is complete.</p>
      <strong>2–0 • PLEASE RESPECT THE RECORD</strong>
    </article>

    <article>
      <div className="autopsyByline"><img src={writers.pike.image} alt={writers.pike.imageAlt}/><span><small>DASHIELL PIKE • CAPITAL & DEMOCRACY</small><b>The market signal</b></span></div>
      <h3>All Ugly is 0–2 with 281.08 points. Kupp is 2–0 with 243.64. Markets remain efficient.</h3>
      <p>All Ugly has outscored Kupp by 37.44 points through two weeks and trails it by two full games in the standings. There are sophisticated explanations involving schedule variance. There is also the simpler explanation: sometimes your portfolio is good and the counterparty still wires the money to someone else.</p>
      <strong>+37.44 POINTS • −2 WINS</strong>
    </article>

    <article>
      <div className="autopsyByline"><img src={writers.march.image} alt={writers.march.imageAlt}/><span><small>SABINE MARCH • PUBLIC LIFE</small><b>The diplomatic cable</b></span></div>
      <h3>Mr Hopkins Opus benched Patrick Mahomes, started Jaxson Dart, and somehow strengthened its position.</h3>
      <p>Dart left with a knee injury and scored minus-0.2. Mahomes scored 32.18 from the bench. Jonathan Taylor and Kenneth Walker then supplied 60.8 points between them, and Hopkins won by 26.7. It is difficult to project calm more effectively than surviving the sort of quarterback decision that normally requires a statement.</p>
      <strong>−0.2 QB • 26.7-POINT WIN</strong>
    </article>

    <article>
      <div className="autopsyByline"><img src={writers.kells.image} alt={writers.kells.imageAlt}/><span><small>MARNIE KELLS • CULTURE & SPORTING LIFE</small><b>The vibe report</b></span></div>
      <h3>CeeDeep got 83.52 points from two human beings and made the rest of the lineup decorative.</h3>
      <p>Josh Allen scored 45.22. CeeDee Lamb scored 38.3. Together they outscored entire fantasy lineups people have started with sincerity. CeeDeep finished at 161.22 and Danir spent the afternoon participating in what was technically still a matchup.</p>
      <strong>83.52 • TWO-MAN GOVERNMENT</strong>
    </article>
  </div>
</section>
<Standings/>
<section className="decisionDesk section"><div className="sectionhead"><div><small className="deskLabel">THE DECISION DESK</small><h2>Start / Sit of the Week</h2></div><span>WEEK 2 • MANAGERIAL JUDGMENT / REVIEWED AFTER THE FACT</span></div><div className="decisionGrid"><article className="startPick"><div className="decisionPhoto"><img src="https://a.espncdn.com/i/headshots/nfl/players/full/12483.png" alt="Matthew Stafford"/><span>MATTHEW STAFFORD</span></div><small>START OF THE WEEK</small><b>Route 22 Clubhouse</b><h3>Matthew Stafford — 30.38</h3><p>One week after Stafford produced 3.3 points and made the entire quarterback room look like a regulatory failure, Route 22 left him in. He answered with four touchdowns on Monday night while Tyler Shough scored 24.28 on the bench. The process finally received its reimbursement.</p><strong>VERDICT: PATIENCE, SOMEHOW REWARDED</strong></article><article className="sitPick"><div className="decisionPhoto"><img src="https://a.espncdn.com/i/headshots/nfl/players/full/4428718.png" alt="Tre Tucker"/><span>TRE TUCKER</span></div><small>SIT OF THE WEEK</small><b>Shake ’N Baker</b><h3>Tre Tucker — 28.9, bench</h3><p>Tucker scored 28.9 while Kyle Pitts occupied a FLEX spot and scored 2.25. That is a 26.65-point decision gap with no injury caveat, no quarterback collapse and no procedural defense. The evidence is unusually cooperative.</p><strong>VERDICT: 26.65 POINTS OF UNUSED CORRECTNESS</strong></article></div></section>
<section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>REAL MOVES / UNREAL COVERAGE</span></div><div className="schefterFeed">{schefter.map((t,i)=><article className="schefterPost" key={i}><img src={`${MEDIA}/transactions/schefter-tipped-off.png`} alt="Adam Schefter Tipped Off"/><div className="schefterBody"><div className="schefterMeta"><b>Adam Schefter</b><span className="verified">✓</span><span>@AdamSchefter · {t[0]}</span><i>•••</i></div><p>{t[1]}</p><div className="schefterEngagement"><span>◯ {t[2]}</span><span>↻ {t[3]}</span><span>♡ {t[4]}</span><span>▥ {t[5]}</span></div></div></article>)}</div><TransactionLedger/><div className="parodyNote">PARODY DESK • TRANSACTIONS VERIFIED AGAINST LEAGUE ACTIVITY</div></section>
<CultureDesk/>
<section className="section upcoming" id="scores"><div className="scoreHero"><div><small>THE BRIEF • SCOREBOARD</small><h2>Week {leagueSnapshot.week}</h2></div><span>WEEK 2 • SCORES + MATCHUPS</span></div><div className="upcomingGrid">{currentMatchups.map(([a,b,note],i)=>{const ap=featuredPlayer(a),bp=featuredPlayer(b);return <Link className="matchupLink" href={`/matchups/${matchupPairs[i][0]}/${matchupPairs[i][1]}`} key={i}><article className="playerHeadlineMatchup">{note&&<small className="matchupKicker">{note}</small>}<div className="matchupPortraits" aria-hidden="true"><img className="leftPlayer" src={playerHeadshot(ap)} alt=""/><img className="rightPlayer" src={playerHeadshot(bp)} alt=""/></div><div className="matchupEditorial"><div className="matchupSide left"><b>{a.teamName}</b><strong>{Number(a.matchup.score).toFixed(1)}</strong><em>PROJ {a.matchup.projection}</em></div><i>VS</i><div className="matchupSide right"><b>{b.teamName}</b><strong>{Number(b.matchup.score).toFixed(1)}</strong><em>PROJ {b.matchup.projection}</em></div></div><div className="matchupPlayers"><span>{ap.name}</span><span>{bp.name}</span></div><span className="matchupOpen">MATCHUP STATUS →</span></article></Link>})}</div></section>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 1</h2><span>LAST WEEK / CONTEXT INCLUDED WHERE EMBARRASSING</span></div><div className="scores">{scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
</main><footer><b>The Brief of Ordinary Gentleman</b><span>League reporting, personal grievances and a legally meaningless permanent record.</span></footer></>}
