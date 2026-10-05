import {loogArticleVideos as alsoVideos} from '../lib/article-videos';
import {LIVE_DESK_ENABLED} from '../lib/live-desk-state';
import Link from 'next/link';import BreakingNewsBanner from './components/BreakingNewsBanner';import SiteNav from './components/SiteNav';import Standings from './components/Standings';import TransactionFeed from './components/TransactionFeed';import CultureDesk from './components/CultureDesk';import PreviewAuthor from './components/PreviewAuthor';import {leagueSnapshot} from './teams/league-data';import {writers} from './articles/writers';import ReelsShelf from './components/ReelsShelf';import AlsoShelf from './components/AlsoShelf';import SundayLiveDesk from './components/SundayLiveDesk';import SundayScoreStrip from './components/SundayScoreStrip';import SharedEditorialFront from './components/SharedEditorialFront';import LiveWeek3Surfaces from './components/LiveWeek3Surfaces'
const week3FinalScores=Object.values(leagueSnapshot.teams).flatMap(team=>team.season.weekly.filter(w=>w.week===3&&w.status==='FINAL'&&team.teamId<(leagueSnapshot.teams[w.opponentSlug]?.teamId||999)).map(w=>[team.teamName,Number(w.score).toFixed(2),w.opponent,Number(w.opponentScore).toFixed(2),'FINAL']));
const week2Scores=[['Pollard Greens','150.07',"I'm a Skatt man",'140.21',''],['Kupp Kupp Doubs','100.48','For the Love of the Kraft','95.48','LOW-SCORE SURVIVAL • 5.00'],['Lloyd of the Rings','143.56','The All Ugly Team','128.22',''],["Shake 'N Baker",'139.49','The Route 22 Clubhouse','138.93','CLOSEST GAME • 0.56'],['Mr Hopkins Opus','133.40','Royrek Tishmeshulam','106.70',''],['CeeDeep Shaheeded Rivalry','161.22','DarkHorse Danir','126.63','LARGEST MARGIN • 34.59']];
const scores=[['Mr Hopkins Opus','181.60','DarkHorse Danir','121.14','LARGEST MARGIN • 60.46'],['Lloyd of the Rings','166.30','Pollard Greens','139.62',''],['Royrek Tishmeshulam','160.91','The All Ugly Team','152.86','CLOSEST GAME • 8.05'],['For the Love of the Kraft','148.16',"Shake 'N Baker",'105.54',''],['The Route 22 Clubhouse','147.90','CeeDeep Shaheed','129.81','STAFFORD SURVIVAL • 3.3'],['Kupp Kupp Doubs','143.16',"I'm a Skatt Man",'130.72','COKER BENCH ALERT • 37.8']];
const matchupPairs=[['skatt','all-ugly','SKATT VS ALL UGLY'],['route-22','kraft','ROUTE 22 VS KRAFT'],['hopkins-opus','pollard-greens','HOPKINS VS POLLARD'],['danir','kupp-doubs','DANIR VS KUPP'],['ceedeep','lloyd-rings','CEEDEEP VS LLOYD'],['royrek','shake-baker','ROYREK VS SHAKE']]
const currentMatchups=matchupPairs.map(([a,b,note])=>[leagueSnapshot.teams[a],leagueSnapshot.teams[b],note])
const featuredPlayer=team=>team.roster.filter(p=>!['Bench','IR','K','D/ST'].includes(p.slot)&&!['K','D/ST'].includes(p.position)).sort((a,b)=>b.seasonPoints-a.seasonPoints)[0]
const playerHeadshot=player=>`https://a.espncdn.com/i/headshots/nfl/players/full/${player.id}.png`
const publishedReels=[
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

const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media';
export const dynamic='force-dynamic';
const isSundayLiveWindow=()=>{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  const weekday=parts.find(part=>part.type==='weekday')?.value;
  const hour=Number(parts.find(part=>part.type==='hour')?.value);
  return LIVE_DESK_ENABLED&&weekday==='Sun'&&hour>=9&&hour<23;
};
export default function Home(){const sundayLive=isSundayLiveWindow();return <><header><div className="utility"><span className="utilityMain">JOURNALISM WITHOUT PURPOSE <i>•</i> WRITTEN BY ROBOTS</span></div><div className="mast"><h1>The Brief of Ordinary Gentleman</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div><SiteNav/></header><BreakingNewsBanner/><main>
{sundayLive&&<><SundayScoreStrip/><SundayLiveDesk/></>}
<ReelsShelf reels={publishedReels}/>
<SharedEditorialFront/>
{!sundayLive&&<SundayLiveDesk/>}

<section className="section autopsySection" id="league">
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
<section className="decisionDesk section"><div className="sectionhead"><div><small className="deskLabel">THE DECISION DESK</small><h2>Start / Sit of the Week</h2></div><span>WEEK 3 • MANAGERIAL JUDGMENT / REVIEWED AFTER THE FACT</span></div><div className="decisionGrid"><article className="startPick"><div className="decisionPhoto"><img loading="lazy" decoding="async" src="https://a.espncdn.com/i/headshots/nfl/players/full/5083076.png" alt="Harold Fannin Jr."/><span>HAROLD FANNIN JR.</span></div><small>START OF THE WEEK</small><b>Pollard Greens</b><h3>Harold Fannin Jr. — 25.1</h3><p>Pollard started Fannin and left T.J. Hockenson on the bench. Fannin returned 25.1; Hockenson scored 4.1. That is a 21-point edge created entirely by choosing the less famous tight end and then having the decency not to overthink it.</p><strong>VERDICT: 21 POINTS OF ACTUAL MANAGERIAL VALUE</strong></article><article className="sitPick"><div className="decisionPhoto"><img loading="lazy" decoding="async" src="https://a.espncdn.com/i/headshots/nfl/players/full/4361050.png" alt="Isaiah Likely"/><span>ISAIAH LIKELY</span></div><small>SIT OF THE WEEK</small><b>Kupp Kupp Doubs</b><h3>Isaiah Likely — 4.3</h3><p>Kupp started Likely at tight end while Juwan Johnson scored 23.8 on the bench. The 19.5-point gap did not decide the matchup by itself, but it did arrive carrying a clipboard, several exhibits and no plausible alibi.</p><strong>VERDICT: 19.5 POINTS LEFT IN EVIDENCE</strong></article></div></section>
<section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>LIVE LEAGUE ACTIVITY / VERIFIED AGAINST ESPN</span></div><TransactionFeed/><div className="parodyNote">PARODY DESK • CURRENT-WEEK TRANSACTIONS PULLED DIRECTLY FROM LEAGUE ACTIVITY</div></section>
<CultureDesk/>
<LiveWeek3Surfaces finalWeek={false} matchupPairs={matchupPairs} teamVisuals={Object.fromEntries(Object.entries(leagueSnapshot.teams).map(([slug,team])=>{const player=featuredPlayer(team);return [slug,{image:playerHeadshot(player),player:player.name}]}))}/>
<section className="section scoreSection" id="scores-week3"><div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week 3 Final</h2></div><span>FINAL SCORES</span></div><div className="scores">{week3FinalScores.map((s,i)=><div className="match" key={i}><div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
<AlsoShelf videos={alsoVideos}/>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 2 Final</h2><span>FINAL SCORES • MONDAY CLOSED THE BOOK</span></div><div className="scores">{week2Scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 1</h2><span>ARCHIVE • CONTEXT INCLUDED WHERE EMBARRASSING</span></div><div className="scores">{scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
</main><footer><b>The Brief of Ordinary Gentleman</b><span>League reporting, personal grievances and a legally meaningless permanent record.</span></footer></>}
