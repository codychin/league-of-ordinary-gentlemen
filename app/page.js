import week6SourcesRaw from '../scripts/week6-staging-video-sources.json';
const week6Sources=Object.fromEntries(week6SourcesRaw.map(v=>[v.id,v.url]));
import LoogAutopsy from './components/LoogAutopsy';
import StartSitOfWeek from './components/StartSitOfWeek';
import completedScores from '../data/latest-loog-scores.json';
import {loogArticleVideos as alsoVideos} from '../lib/article-videos';
import {isSundayLiveWindow} from '../lib/live-desk-state';
import Link from 'next/link';import SiteNav from './components/SiteNav';import Standings from './components/Standings';import TransactionFeed from './components/TransactionFeed';import CultureDesk from './components/CultureDesk';import PreviewAuthor from './components/PreviewAuthor';import {leagueSnapshot} from './teams/league-data';import {writers} from './articles/writers';import ReelsShelf from './components/ReelsShelf';import AlsoShelf from './components/AlsoShelf';import SundayLiveDesk from './components/SundayLiveDesk';import SundayScoreStrip from './components/SundayScoreStrip';import SharedEditorialFront from './components/SharedEditorialFront';import LiveWeek3Surfaces from './components/LiveWeek3Surfaces'
const week3FinalScores=Object.values(leagueSnapshot.teams).flatMap(team=>team.season.weekly.filter(w=>w.week===3&&w.status==='FINAL'&&team.teamId<(leagueSnapshot.teams[w.opponentSlug]?.teamId||999)).map(w=>[team.teamName,Number(w.score).toFixed(2),w.opponent,Number(w.opponentScore).toFixed(2),'FINAL']));
const week2Scores=[['Pollard Greens','150.07',"I'm a Skatt man",'140.21',''],['Kupp Kupp Doubs','100.48','For the Love of the Kraft','95.48','LOW-SCORE SURVIVAL • 5.00'],['Lloyd of the Rings','143.56','The All Ugly Team','128.22',''],["Shake 'N Baker",'139.49','The Route 22 Clubhouse','138.93','CLOSEST GAME • 0.56'],['Mr Hopkins Opus','133.40','Royrek Tishmeshulam','106.70',''],['CeeDeep Shaheeded Rivalry','161.22','DarkHorse Danir','126.63','LARGEST MARGIN • 34.59']];
const scores=[['Mr Hopkins Opus','181.60','DarkHorse Danir','121.14','LARGEST MARGIN • 60.46'],['Lloyd of the Rings','166.30','Pollard Greens','139.62',''],['Royrek Tishmeshulam','160.91','The All Ugly Team','152.86','CLOSEST GAME • 8.05'],['For the Love of the Kraft','148.16',"Shake 'N Baker",'105.54',''],['The Route 22 Clubhouse','147.90','CeeDeep Shaheed','129.81','STAFFORD SURVIVAL • 3.3'],['Kupp Kupp Doubs','143.16',"I'm a Skatt Man",'130.72','COKER BENCH ALERT • 37.8']];
const matchupPairs=[['skatt','all-ugly','SKATT VS ALL UGLY'],['route-22','kraft','ROUTE 22 VS KRAFT'],['hopkins-opus','pollard-greens','HOPKINS VS POLLARD'],['danir','kupp-doubs','DANIR VS KUPP'],['ceedeep','lloyd-rings','CEEDEEP VS LLOYD'],['royrek','shake-baker','ROYREK VS SHAKE']]
const currentMatchups=matchupPairs.map(([a,b,note])=>[leagueSnapshot.teams[a],leagueSnapshot.teams[b],note])
const featuredPlayer=team=>team.roster.filter(p=>!['Bench','IR','K','D/ST'].includes(p.slot)&&!['K','D/ST'].includes(p.position)).sort((a,b)=>b.seasonPoints-a.seasonPoints)[0]
const playerHeadshot=player=>`https://a.espncdn.com/i/headshots/nfl/players/full/${player.id}.png`
const publishedReels=[
  ["all-ugly","ceedeep","The All Ugly Team · CeeDeep Shaheeded Rivalry","The All Ugly Team vs. CeeDeep Shaheeded Rivalry","Hollis Crane",writers.crane.image,"624a4bbd1764945887d6b5e59bf2c569"],
  ["danir","route-22","DarkHorse Danir · The Route 22 Clubhouse","DarkHorse Danir vs. The Route 22 Clubhouse","Conrad Sorrell",writers.sorrell.image,"dd4a0886e3b8570b7e0b478cd2494473"],
  ["skatt","hopkins-opus","I'm a Skatt man · Mr Hopkins Opus","I'm a Skatt man vs. Mr Hopkins Opus","Maude Gannon",writers.gannon.image,"15fabdd59b7336b35c8ad851f1449fb0"],
  ["lloyd-rings","kupp-doubs","Lloyd of the Rings · Kupp Kupp Doubs","Lloyd of the Rings vs. Kupp Kupp Doubs","Dashiell Pike",writers.pike.image,"a2d015c95e646c9902128869c408ce11"],
  ["shake-baker","pollard-greens","Shake 'N Baker · Pollard Greens","Shake 'N Baker vs. Pollard Greens","Marnie Kells",writers.kells.image,"f47f31d0791ee1022f82004e2c1b9ef2"],
  ["royrek","kraft","Royrek Tishmeshulam · For the Love of the Kraft","Royrek Tishmeshulam vs. For the Love of the Kraft","Sabine March",writers.march.image,"ded303e56680d12f48cdeec27f5db1fc"],
].map(([left,right,short,matchup,correspondent,avatar,id])=>{
  const lp=featuredPlayer(leagueSnapshot.teams[left]);
  const rp=featuredPlayer(leagueSnapshot.teams[right]);
  return {id,left,right,short,matchup,correspondent,avatar,videoUrl:week6Sources[id],leftImage:playerHeadshot(lp),rightImage:playerHeadshot(rp)};
});

const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media';
export const dynamic='force-dynamic';
export default function Home(){const sundayLive=isSundayLiveWindow();return <><header><div className="utility"><span className="utilityMain">JOURNALISM WITHOUT PURPOSE <i>•</i> WRITTEN BY ROBOTS</span></div><div className="mast"><h1>The Brief of Ordinary Gentleman</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div><SiteNav/></header><main>
{sundayLive&&<><SundayScoreStrip/><SundayLiveDesk/></>}
<ReelsShelf reels={publishedReels} releaseId="loog-week6-preview-v1" storageKey="brief-loog-week6-preview-viewed-v1" weekLabel="THE BRIEF • WEEK 6" title="Week 6, the previews." modeLabel="WEEK 6 • PREVIEWS"/>
<SharedEditorialFront/>
{!sundayLive&&<SundayLiveDesk/>}

<LoogAutopsy/>
<Standings/>
<StartSitOfWeek/>
<section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>LIVE LEAGUE ACTIVITY / VERIFIED AGAINST ESPN</span></div><TransactionFeed/><div className="parodyNote">PARODY DESK • RECENT COMPLETED TRANSACTIONS PULLED DIRECTLY FROM LEAGUE ACTIVITY</div></section>
<CultureDesk/>
<LiveWeek3Surfaces initialData={completedScores} finalWeek={false} matchupPairs={matchupPairs} teamVisuals={Object.fromEntries(Object.entries(leagueSnapshot.teams).map(([slug,team])=>{const player=featuredPlayer(team);return [slug,{image:playerHeadshot(player),player:player.name}]}))}/>
<section className="section scoreSection" id="scores-week3"><div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week 3 Final</h2></div><span>FINAL SCORES</span></div><div className="scores">{week3FinalScores.map((s,i)=><div className="match" key={i}><div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
<AlsoShelf videos={alsoVideos}/>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 2 Final</h2><span>FINAL SCORES • MONDAY CLOSED THE BOOK</span></div><div className="scores">{week2Scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 1</h2><span>ARCHIVE • CONTEXT INCLUDED WHERE EMBARRASSING</span></div><div className="scores">{scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
</main><footer><b>The Brief of Ordinary Gentleman</b><span>League reporting, personal grievances and a legally meaningless permanent record.</span></footer></>}
