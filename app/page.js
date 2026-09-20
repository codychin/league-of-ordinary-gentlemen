import Link from 'next/link';import SiteNav from './components/SiteNav';import Standings from './components/Standings';import TransactionLedger from './components/TransactionLedger';import CultureDesk from './components/CultureDesk';import PreviewAuthor from './components/PreviewAuthor';import SundayLiveDesk from './components/SundayLiveDesk';import {leagueSnapshot} from './teams/league-data';import {writers} from './articles/writers'
const scores=[['Mr Hopkins Opus','181.60','DarkHorse Danir','121.14','LARGEST MARGIN • 60.46'],['Lloyd of the Rings','166.30','Pollard Greens','139.62',''],['Royrek Tishmeshulam','160.91','The All Ugly Team','152.86','CLOSEST GAME • 8.05'],['For the Love of the Kraft','148.16',"Shake 'N Baker",'105.54',''],['The Route 22 Clubhouse','147.90','CeeDeep Shaheed','129.81','STAFFORD SURVIVAL • 3.3'],['Kupp Kupp Doubs','143.16',"I'm a Skatt Man",'130.72','COKER BENCH ALERT • 37.8']];
const matchupPairs=[['skatt','pollard-greens','COIN FLIP'],['kraft','kupp-doubs',''],['all-ugly','lloyd-rings','FAMILY BUSINESS'],['route-22','shake-baker','PHONES EXPECTED TO REMAIN OPEN'],['hopkins-opus','royrek','KASH HAS NEW EVIDENCE'],['danir','ceedeep','REHABILITATION OPPORTUNITY']]
const currentMatchups=matchupPairs.map(([a,b,note])=>[leagueSnapshot.teams[a],leagueSnapshot.teams[b],note])
const featuredPlayer=team=>team.roster.filter(p=>!['Bench','IR','K','D/ST'].includes(p.slot)&&!['K','D/ST'].includes(p.position)).sort((a,b)=>b.seasonPoints-a.seasonPoints)[0]
const playerHeadshot=player=>`https://a.espncdn.com/i/headshots/nfl/players/full/${player.id}.png`
const schefter=[['SEP 17','🚨 BREAKING: Mr Hopkins Opus has added WR Demarcus Robinson for $0 and released RB George Holani, per the ESPN transaction record. The Holani era lasted approximately one business day.','31','84','917','61K'],['SEP 17','🚨 WAIVER: DarkHorse Danir has acquired RB Rachaad White for $2 and dropped WR Malik Washington. White joins a bench currently operating under independent oversight.','44','103','1.2K','77K'],['SEP 16','🚨 BREAKING: All Ugly is adding RB Demond Claiborne for $0, per league sources. The move comes with Jordan Mason on IR and carries what one executive described as “limited financial downside.”','22','68','743','52K'],['SEP 16','🚨 BREAKING: Route 22 remains active on the trade market, sources tell The Brief. Choe and Gerstone have sent multiple proposals since Monday; at least three teams have already declined. The phones remain open.','91','214','2.1K','198K']];
const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media';
export default function Home(){return <><header><div className="utility"><span className="utilityMain">JOURNALISM WITHOUT PURPOSE <i>•</i> WRITTEN BY ROBOTS</span></div><div className="mast"><h1>The Brief of Ordinary Gentleman</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div><SiteNav/></header><main>
<section className="morningBriefPreview sundayLiveEdition" aria-label="Sunday Morning Brief">
  <div className="morningBriefFlag"><span><i className="liveDot"/> THE SUNDAY MORNING BRIEF • LIVE</span><small>WEEK 2 • SUNDAY, SEPTEMBER 20</small></div>
  <div className="sundayLiveLead">
    <div className="sundayLiveArt" aria-hidden="true">
      {currentMatchups.slice(0,3).map(([a,b],i)=><div className={"sundayLivePair pair"+i} key={i}><img src={playerHeadshot(featuredPlayer(a))} alt=""/><img src={playerHeadshot(featuredPlayer(b))} alt=""/></div>)}
      <div className="sundayLiveArtLabel"><small>FIRST KICK • 1:00 PM ET</small><b>SUNDAY</b><span>THE LEAGUE IS CURRENTLY INTACT</span></div>
    </div>
    <div className="sundayLiveLeadCopy"><span className="morningBriefEdition">THE NEWSROOM IS AWAKE</span><h2>Six Games. Several Bad Decisions. We’re Here Until the Evidence Stops Moving.</h2><p>Thursday already did damage. Six matchups remain. The Brief will be live through the late window with scores, dispatches, actual football analysis and whatever Hollis claims happened near LaGuardia.</p></div>
  </div>
  <div className="sundayPulse">
    <span><small>THURSDAY</small><b>Allen 45.22</b><em>CeeDeep already has paperwork.</em></span>
    <span><small>ALL UGLY</small><b>Amon-Ra 36.2</b><em>Process temporarily vindicated.</em></span>
    <span><small>ROUTE 22</small><b>Cook 27.0</b><em>The phones remain inexplicably open.</em></span>
  </div>
  <div className="morningBriefGrid sundayFiles">
    <Link href="/articles/maude-sunday-board-week-2" className="morningBriefItem storylink"><div className="briefWriterVisual"><img src={writers.gannon.image} alt={writers.gannon.imageAlt}/><em>MAUDE • FILM ROOM</em></div><small>FOOTBALL / BAD PROCESS</small><b>Three decisions I would actually care about</b><p>The projection moved two points. Maude would like everyone to regain control of themselves.</p><span>READ MAUDE'S BOARD →</span></Link>
    <Link href="/articles/hollis-kash-folder" className="morningBriefItem storylink"><div className="briefWriterVisual"><img src={writers.crane.image} alt={writers.crane.imageAlt}/><em>HOLLIS • EVIDENCE LOCKER</em></div><small>INVESTIGATIONS</small><b>The man at the end of the bar had a folder with Kash's name on it.</b><p>Three drinks. One airport bar. A screenshot. Hollis has unfortunately filed.</p><span>OPEN THE FILE →</span></Link>
    <Link href="/articles/dashiell-route-22-portfolio" className="morningBriefItem storylink"><div className="briefWriterVisual"><img src={writers.pike.image} alt={writers.pike.imageAlt}/><em>DASHIELL • CAPITAL</em></div><small>MARKETS / SELF-HARM</small><b>Route 22 is winning and would still like to restructure the company.</b><p>James Cook scored 27. Management has responded by discovering activist investing.</p><span>FOLLOW THE MONEY →</span></Link>
  </div>
  <div className="morningBriefRoundtable liveVoices">
    <small>FROM THE DESKS</small>
    <div><b>CONRAD SORRELL</b><span>“By 1:17 somebody will describe a lineup decision as an institution. I intend to find out who benefits.”</span></div>
    <div><b>SABINE MARCH</b><span>“Twelve managers are entering six bilateral disputes with no neutral observers and several family relationships. Diplomacy remains available.”</span></div>
    <div><b>MARNIE KELLS</b><span>“I am not writing about culture merely because Sunday has arrived. Somebody famous will have to embarrass themselves first.”</span></div>
  </div>
  <div className="morningBriefFooter"><b>LIVE DESK OPENS 12:30 PM.</b><span>Pregame → early window → late window → evidence preservation</span></div>
</section>
<section className="hero heroStack" id="league"><Link className="hero-copy storylink" href="/articles/league-unbearable-tnf"><div className="eyebrow">THURSDAY NIGHT • FINAL</div><div className="photoHero tnfPhoto"><div><small>WEEK 2 OPENING STATEMENT</small><b>Josh Allen</b><strong>45.22</strong><span>FANTASY POINTS</span></div></div><h2>Josh Allen Scores Five Times. <em>CeeDeep Has Already Made Sunday Feel Procedural.</em></h2><PreviewAuthor slug="league-unbearable-tnf"/><p className="standfirst">Buffalo opened its new stadium with a 41–31 win. Allen supplied 45.22 fantasy points and turned Friday into an administrative exercise for DarkHorse Danir.</p><div className="read">READ THE DAMAGE REPORT →</div></Link></section>
<section className="grid3"><Link href="/articles/stone-unc-denial" className="card storylink"><div className="photoStrip uncPhoto"><span>CHAPEL HILL / INDEPENDENT REVIEW</span></div><div className="tag">INSTITUTIONAL CRISIS</div><h3>Stone Denies UNC Scandal Ties Despite Triple Legacy; Choe Admits “Limited Advisory Role”</h3><PreviewAuthor slug="stone-unc-denial"/><p>UNC closed its football investigation. Stone produced a suspiciously complete denial. Choe has declined to deny exactly enough.</p><div className="read">REVIEW THE FINDINGS →</div></Link><Link href="/articles/danir-emergency-jobs-program" className="card storylink"><div className="photoStrip danirJobsPhoto"><span>DARKHORSE DANIR / WORKFORCE DEVELOPMENT</span></div><div className="tag">TRANSACTIONS & LABOR</div><h3>DarkHorse Danir Announces Emergency Jobs Program for Underemployed Wide Receivers</h3><PreviewAuthor slug="danir-emergency-jobs-program"/><p>Nailor. Saylors. Washington. Wicks. White. One failed Vele claim. September employment remains strong.</p><div className="read">VISIT THE EMPLOYMENT OFFICE →</div></Link><Link href="/articles/danir-bench-crime" className="card storylink"><div className="photoStrip purdyPhoto"><span>PURDY + MONANGAI / 52.0 BENCH POINTS</span></div><div className="tag">LINEUP CRIMES UNIT</div><h3>Danir Left a Functional Quarterback and 29.4-Point Running Back on the Bench</h3><PreviewAuthor slug="danir-bench-crime"/><p>Bo Nix scored 4.74. Brock Purdy scored 22.6. Kyle Monangai scored 29.4. The prosecution would like to rest.</p><div className="read">REVIEW THE CRIME SCENE →</div></Link></section>
<SundayLiveDesk/>
<section className="section autopsySection">
  <div className="autopsyHeader">
    <div><small>THE NEWSROOM • MONDAY FILE</small><h2>Monday Morning Autopsy</h2></div>
    <span>WEEK 1 / SIX WRITERS / ONE UNNECESSARILY COMPLETE POSTMORTEM</span>
  </div>

  <div className="autopsyLead">
    <div className="autopsyByline"><img src={writers.gannon.image} alt={writers.gannon.imageAlt}/><span><small>MAUDE GANNON • FOOTBALL STRATEGY</small><b>The actual football finding</b></span></div>
    <h3>The running backs did not merely decide Week 1. They made most of the managerial analysis decorative.</h3>
    <p>Walker 44.4. Derrick Henry 41.7. Ashton Jeanty 39.0. D'Andre Swift 38.2. Four managers received a full lineup's worth of emotional security from one roster spot. Three won. The useful lesson is not “draft running backs.” It is that when one position hands you a 40-point event, the rest of your process mostly gets to avoid cross-examination.</p>
  </div>

  <div className="autopsyNewsroom">
    <article>
      <div className="autopsyByline"><img src={writers.crane.image} alt={writers.crane.imageAlt}/><span><small>HOLLIS CRANE • INVESTIGATIONS</small><b>The evidence locker</b></span></div>
      <h3>Danir’s bench is now a crime scene with excellent lighting.</h3>
      <p>Purdy and Monangai combined for 52 unused points. It did not cost Danir a 60-point loss, which is almost worse. Nothing was stolen. Nothing changed the verdict. We are simply left with the photograph.</p>
      <strong>52.0 • UNDEPLOYED</strong>
    </article>

    <article>
      <div className="autopsyByline"><img src={writers.sorrell.image} alt={writers.sorrell.imageAlt}/><span><small>CONRAD SORRELL • OPINION & POWER</small><b>The winner's privilege</b></span></div>
      <h3>Roy Bird benched 37.8 points and was rewarded with the right to call it depth.</h3>
      <p>Winning is the great laundering mechanism of fantasy football. Lose with Coker on the bench and the decision becomes malpractice. Win anyway and suddenly the organization possesses “strategic reserves.” Institutions are remarkable that way.</p>
      <strong>37.8 • RETROACTIVE GENIUS</strong>
    </article>

    <article>
      <div className="autopsyByline"><img src={writers.pike.image} alt={writers.pike.imageAlt}/><span><small>DASHIELL PIKE • CAPITAL & DEMOCRACY</small><b>The market signal</b></span></div>
      <h3>All Ugly generated 152.86 points and immediately founded a statistics department.</h3>
      <p>Caleb Williams and Christian Watson produced 75.96 together. The team still lost. By midnight, Expected Wins had become essential infrastructure. This is how new institutions are born: first the market fails you, then you invent a metric explaining why.</p>
      <strong>75.96 • TWO PLAYERS, ZERO RELIEF</strong>
    </article>

    <article>
      <div className="autopsyByline"><img src={writers.march.image} alt={writers.march.imageAlt}/><span><small>SABINE MARCH • PUBLIC LIFE</small><b>The diplomatic cable</b></span></div>
      <h3>The Katz family office emerged from Week 1 with the calm of a government that has already counted the votes.</h3>
      <p>Henry and Flowers supplied 73.7 points, Lloyd remained largely ceremonial, and the brothers advanced without any visible constitutional crisis. In a league built on public grievance, quiet family governance is beginning to look almost provocative.</p>
      <strong>73.7 • FAMILY OFFICE OUTPUT</strong>
    </article>

    <article>
      <div className="autopsyByline"><img src={writers.kells.image} alt={writers.kells.imageAlt}/><span><small>MARNIE KELLS • CULTURE & SPORTING LIFE</small><b>The vibe report</b></span></div>
      <h3>Kash scored 181.60, which is less a fantasy total than a content strategy.</h3>
      <p>The performance was excellent. More importantly, it created months of reusable material for Kash to deploy in conversations that have nothing to do with Week 1. Some people win games. Some people acquire intellectual property.</p>
      <strong>181.60 • NOW A PERSONAL BRAND</strong>
    </article>
  </div>
</section>
<Standings/>
<section className="decisionDesk section"><div className="sectionhead"><div><small className="deskLabel">THE DECISION DESK</small><h2>Start / Sit of the Week</h2></div><span>MANAGERIAL JUDGMENT / REVIEWED AFTER THE FACT</span></div><div className="decisionGrid"><article className="startPick"><div className="decisionPhoto"><img src="https://a.espncdn.com/i/headshots/nfl/players/full/4361050.png" alt="Isaiah Likely"/><span>ISAIAH LIKELY</span></div><small>START OF THE WEEK</small><b>Roy Bird</b><h3>Isaiah Likely — 28.8</h3><p>Likely was placed in the lineup and produced 28.8. This sounds simple because competent decisions often do after they work.</p><strong>VERDICT: NO NOTES</strong></article><article className="sitPick"><div className="decisionPhoto"><img src="https://a.espncdn.com/i/headshots/nfl/players/full/4608686.png" alt="Kyle Monangai"/><span>KYLE MONANGAI</span></div><small>SIT OF THE WEEK</small><b>Danir</b><h3>Kyle Monangai — 29.4, bench</h3><p>Monangai remained seated while the active lineup lost by 60.46. It did not cost Danir the game. It did, however, create a permanent public record.</p><strong>VERDICT: EVIDENCE PRESERVED</strong></article></div></section>
<section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>REAL MOVES / UNREAL COVERAGE</span></div><div className="schefterFeed">{schefter.map((t,i)=><article className="schefterPost" key={i}><img src={`${MEDIA}/transactions/schefter-tipped-off.png`} alt="Adam Schefter Tipped Off"/><div className="schefterBody"><div className="schefterMeta"><b>Adam Schefter</b><span className="verified">✓</span><span>@AdamSchefter · {t[0]}</span><i>•••</i></div><p>{t[1]}</p><div className="schefterEngagement"><span>◯ {t[2]}</span><span>↻ {t[3]}</span><span>♡ {t[4]}</span><span>▥ {t[5]}</span></div></div></article>)}</div><TransactionLedger/><div className="parodyNote">PARODY DESK • TRANSACTIONS VERIFIED AGAINST LEAGUE ACTIVITY</div></section>
<CultureDesk/>
<section className="section upcoming" id="scores"><div className="scoreHero"><div><small>THE BRIEF • SCOREBOARD</small><h2>Week {leagueSnapshot.week}</h2></div><span><b>LIVE</b> SCORES + PROJECTIONS</span></div><div className="upcomingGrid">{currentMatchups.map(([a,b,note],i)=>{const ap=featuredPlayer(a),bp=featuredPlayer(b);return <Link className="matchupLink" href={`/matchups/${matchupPairs[i][0]}/${matchupPairs[i][1]}`} key={i}><article className="playerHeadlineMatchup">{note&&<small className="matchupKicker">{note}</small>}<div className="matchupPortraits" aria-hidden="true"><img className="leftPlayer" src={playerHeadshot(ap)} alt=""/><img className="rightPlayer" src={playerHeadshot(bp)} alt=""/></div><div className="matchupEditorial"><div className="matchupSide left"><b>{a.teamName}</b><strong>{Number(a.matchup.score).toFixed(1)}</strong><em>PROJ {a.matchup.projection}</em></div><i>VS</i><div className="matchupSide right"><b>{b.teamName}</b><strong>{Number(b.matchup.score).toFixed(1)}</strong><em>PROJ {b.matchup.projection}</em></div></div><div className="matchupPlayers"><span>{ap.name}</span><span>{bp.name}</span></div><span className="matchupOpen">GAME PREVIEW →</span></article></Link>})}</div></section>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 1</h2><span>LAST WEEK / CONTEXT INCLUDED WHERE EMBARRASSING</span></div><div className="scores">{scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
</main><footer><b>The Brief of Ordinary Gentleman</b><span>League reporting, personal grievances and a legally meaningless permanent record.</span></footer></>}
