import {week8Reels} from '../lib/week8-reels';
import {week7Reels} from '../lib/week7-reels';
const recapReels=week7Reels('loog');
import LoogAutopsy from './components/LoogAutopsy';
import StartSitOfWeek from './components/StartSitOfWeek';
import latestScores from '../data/latest-loog-scores.json';
import completedScores from '../data/completed-loog-scores.json';
import {selectLoogScores} from '../lib/select-loog-scores.mjs';
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
const publishedReels=recapReels.map(reel=>{
  const {left,right,writer}=reel;
  const lp=featuredPlayer(leagueSnapshot.teams[left]);
  const rp=featuredPlayer(leagueSnapshot.teams[right]);
  return {...reel,correspondent:writers[writer].name,avatar:writers[writer].image,leftImage:playerHeadshot(lp),rightImage:playerHeadshot(rp)};
});

const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media';
export const dynamic='force-dynamic';
export default async function Home(){
let provider;
try {
 const response=await fetch('https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=scores',{cache:'no-store'});
 if(response.ok)provider=await response.json();
}catch{}
const currentScores=selectLoogScores({provider,latest:latestScores,completed:completedScores});
const previewReels=week8Reels('loog').map(r=>{
 const left=leagueSnapshot.teams[r.left],right=leagueSnapshot.teams[r.right];
 return {...r,leftImage:left?playerHeadshot(featuredPlayer(left)):'',rightImage:right?playerHeadshot(featuredPlayer(right)):''};
});
const sundayLive=isSundayLiveWindow();return <><header><div className="utility"><span className="utilityMain">JOURNALISM WITHOUT PURPOSE <i>•</i> WRITTEN BY ROBOTS</span></div><div className="mast"><h1>The Brief of Ordinary Gentleman</h1><div className="dek">Fantasy football, personal grievances, forensic accounting and other matters of irrelevance.</div></div><SiteNav/></header><main>
{sundayLive&&<><SundayScoreStrip/><SundayLiveDesk/></>}
{previewReels.length===6&&<ReelsShelf reels={previewReels} releaseId="loog-week8-preview-v2" storageKey="brief-loog-week8-preview-viewed-v2" weekLabel="THE BRIEF • WEEK 8" title="Week 8, the previews." modeLabel="WEEK 8 • PREVIEWS" mediaKind="preview" autoOpenFromQuery={false}/>}
{previewReels.length!==6&&<ReelsShelf reels={publishedReels} releaseId="loog-week7-recap-v2" storageKey="brief-loog-week7-recap-viewed-v2" weekLabel="THE BRIEF • WEEK 7" title="Week 7, the recaps." modeLabel="WEEK 7 • RECAPS"/>}
<SharedEditorialFront/>
{!sundayLive&&<SundayLiveDesk/>}

<LoogAutopsy/>
<Standings/>
<StartSitOfWeek/>
<section className="wire section" id="transactions"><div className="sectionhead"><div><small className="deskLabel">THE WIRE</small><h2>Transactions</h2></div><span>LIVE LEAGUE ACTIVITY / VERIFIED AGAINST ESPN</span></div><TransactionFeed/><div className="parodyNote">PARODY DESK • RECENT COMPLETED TRANSACTIONS PULLED DIRECTLY FROM LEAGUE ACTIVITY</div></section>
<CultureDesk/>
<LiveWeek3Surfaces initialData={currentScores} finalWeek={false} matchupPairs={matchupPairs} teamVisuals={Object.fromEntries(Object.entries(leagueSnapshot.teams).map(([slug,team])=>{const player=featuredPlayer(team);return [slug,{image:playerHeadshot(player),player:player.name}]}))}/>
<section className="section scoreSection" id="scores-week3"><div className="sectionhead"><div><small className="deskLabel">THE BRIEF • SCOREBOARD</small><h2>Week 3 Final</h2></div><span>FINAL SCORES</span></div><div className="scores archiveScores">{week3FinalScores.map((s,i)=><div className="match" key={i}><div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
<AlsoShelf videos={alsoVideos}/>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 2 Final</h2><span>FINAL SCORES • MONDAY CLOSED THE BOOK</span></div><div className="scores archiveScores">{week2Scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
<section className="section scoreSection"><div className="sectionhead"><h2>Week 1</h2><span>ARCHIVE • CONTEXT INCLUDED WHERE EMBARRASSING</span></div><div className="scores archiveScores">{scores.map((s,i)=><div className={`match ${s[4]?'notable':''}`} key={i}>{s[4]&&<small className="scoreNote">{s[4]}</small>}<div><b>{s[0]}</b><strong>{s[1]}</strong></div><div><span>{s[2]}</span><strong>{s[3]}</strong></div></div>)}</div></section>
</main><footer><b>The Brief of Ordinary Gentleman</b><span>League reporting, personal grievances and a legally meaningless permanent record.</span></footer></>}
