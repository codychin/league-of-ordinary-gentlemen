import Link from 'next/link'
import SiteNav from '../../../components/SiteNav'
import {leagueSnapshot} from '../../../teams/league-data'
import {teams} from '../../../teams/data'
import {writers} from '../../../articles/writers'

const fmt=value=>{
  const n=Number(value)
  if(!Number.isFinite(n)) return '—'
  return n.toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1')
}
const SLOT_ORDER={QB:0,RB:1,WR:2,TE:3,FLEX:4,'D/ST':5,K:6}
const activeRoster=team=>team.roster
  .filter(player=>player.slot!=='Bench'&&player.slot!=='IR')
  .sort((a,b)=>(SLOT_ORDER[a.slot]??99)-(SLOT_ORDER[b.slot]??99))
const profileFor=id=>teams.find(team=>team.id===id)
const trendFor=player=>{
  if(!player||player.slot==='D/ST'||player.slot==='K') return null
  const current=Number(player.weekPoints)||0
  const prior=Math.max(0,(Number(player.seasonPoints)||0)-current)
  const hotLine=player.position==='QB'?20:14
  const coldLine=player.position==='QB'?15:9
  if(prior>=hotLine&&current>=hotLine) return {type:'hot',label:'🔥 HEATER',detail:`${fmt(prior)} → ${fmt(current)}`}
  if(current>0&&prior<coldLine&&current<coldLine) return {type:'cold',label:'🧊 COLD',detail:`${fmt(prior)} → ${fmt(current)}`}
  return null
}

const previewKey=(a,b)=>[a,b].sort().join(':')
const matchupPreviews={
  'kraft:skatt':{
    writer:'kells',
    title:'The Injury Report Has Become the Actual Matchup',
    body:"Skatt is 0–2 despite scoring 271.43 and finally gets the matchup the projection model has been begging for: Kraft enters with Puka Nacua and Nico Collins both listed out and a projection under 95. The joke, naturally, is that the franchise called Yonjuries is currently the healthier government. If Yon loses this one, The Count may need to begin counting something other than aliases."
  },
  'all-ugly:pollard-greens':{
    writer:'gannon',
    title:'The 0–2 Team That Scores vs. the 1–1 Team That Gets Scored On',
    body:"All Ugly has 281.08 points and no wins. Pollard Greens has 289.69 points and has already allowed 306.51. That makes this less a matchup than a controlled experiment in whether underlying scoring eventually defeats schedule violence. The complication is health: Caleb Williams and Jonathan Brooks are doubtful, Jadarian Price is questionable, and JSN is coming off 48.5. Process has asked for a fair trial and immediately received this."
  },
  'kupp-doubs:route-22':{
    writer:'pike',
    title:'Undefeated Balance Sheet Meets Permanently Open Trading Desk',
    body:"Kupp Kupp Doubs is 2–0 with 243.64 points, which is the fantasy equivalent of posting modest revenue and an immaculate share price. Route 22 has scored 43.19 more points, is 1–1, and lost last week by 0.56 despite finally getting the Stafford game it wanted. Roy Bird has discovered the value of outcomes. Choe and Gerstone remain committed to activity. Markets will now decide which ideology is more annoying."
  },
  'hopkins-opus:lloyd-rings':{
    writer:'sorrell',
    title:'Somebody’s Undefeated Record Has to Become Less Impressive',
    body:"This is the first matchup of the season that deserves actual heavyweight language. Hopkins is 2–0 with a league-best 315.00 points. Lloyd is 2–0 with 309.86. Both have won twice without needing philosophical explanations. Kash has the louder institution; the Katz family office has the quieter one. Zay Flowers being out tilts the personnel question, but the larger pleasure is simpler: one of the two cleanest records in the league is finally going to acquire a blemish, unless fantasy football finds an even stupider outcome."
  },
  'danir:shake-baker':{
    writer:'crane',
    title:'Two Crime Scenes, One Win Available',
    body:"Danir corrected the Week 1 bench fiasco and was rewarded by drawing 161.22 from CeeDeep. Shake ’N Baker left Tre Tucker’s 28.9 on the bench and won by 0.56 anyway. So naturally they meet now. One organization is discovering that improved process does not guarantee mercy; the other is discovering that terrible process occasionally receives witness protection. I don’t know which lesson is worse."
  },
  'ceedeep:royrek':{
    writer:'march',
    title:'A Matchup for People Who Prefer Their Stars Very Visible',
    body:"CeeDeep arrives after Josh Allen and CeeDee Lamb produced 83.52 points between them. Royrek counters with Lamar Jackson, Justin Jefferson and a Davante Adams performance that briefly made the rest of Week 2 irrelevant. Neither roster is subtle. The social question is which side gets to spend Sunday acting as though this was all inevitable."
  },
}

export default async function MatchupPreview({params}){
  const {a,b}=await params
  const left=leagueSnapshot.teams[a]
  const right=leagueSnapshot.teams[b]
  const leftProfile=profileFor(a)
  const rightProfile=profileFor(b)

  if(!left||!right||!leftProfile||!rightProfile){
    return <main className="matchupPage"><h1>Matchup not found.</h1><Link href="/#scores">Return to scores</Link></main>
  }

  const leftStarters=activeRoster(left)
  const rightStarters=activeRoster(right)
  const rows=Array.from({length:Math.max(leftStarters.length,rightStarters.length)},(_,index)=>[leftStarters[index],rightStarters[index]])
  const projectionGap=Math.abs(Number(left.matchup.projection)-Number(right.matchup.projection))
  const projectedLeader=Number(left.matchup.projection)>=Number(right.matchup.projection)?leftProfile:rightProfile
  const leftStatuses=leftStarters.filter(player=>player.status).length
  const rightStatuses=rightStarters.filter(player=>player.status).length
  const preview=matchupPreviews[previewKey(a,b)]||{
    writer:'gannon',
    title:'What this matchup is actually asking',
    body:`${leftProfile.team} and ${rightProfile.team} arrive with enough live projection uncertainty to make confident analysis irresponsible, which has never stopped this publication before. The useful part is the roster construction, the manager tendencies and which side creates the first avoidable problem.`
  }
  const writer=writers[preview.writer]

  return <>
    <header className="articleHeader"><Link href="/" className="miniMast">The Brief of Ordinary Gentleman</Link><SiteNav/></header>
    <main className="matchupPage">
      <section className="matchupLead">
        <div className="matchupHeroKicker">WEEK {leagueSnapshot.week} • GAME PREVIEW</div>
        <div className="matchupScoreboard">
          <Link href={`/teams/${a}`} className="matchupHeroSide">
            <small>{leftProfile.owners}</small>
            <h1>{left.teamName}</h1>
            <b>{fmt(left.matchup.score)}</b>
            <span>PROJECTED {left.matchup.projection}</span>
          </Link>
          <div className="matchupHeroCenter"><span>VS</span><small>LIVE</small></div>
          <Link href={`/teams/${b}`} className="matchupHeroSide right">
            <small>{rightProfile.owners}</small>
            <h1>{right.teamName}</h1>
            <b>{fmt(right.matchup.score)}</b>
            <span>PROJECTED {right.matchup.projection}</span>
          </Link>
        </div>
        <div className="matchupUpdated">LIVE SNAPSHOT • {leagueSnapshot.updatedAt}</div>
      </section>

      <section className="matchupColumn">
        <div className="matchupColumnByline">
          <img src={writer.image} alt={writer.imageAlt}/>
          <div><small>GAME PREVIEW • {writer.title.toUpperCase()}</small><b>{writer.name}</b></div>
        </div>
        <h2>{preview.title}</h2>
        <p>{preview.body}</p>
      </section>

      <section className="matchupPrimer">
        <div className="matchupSectionHead"><small>THE BRIEF'S READ</small><h2>Numbers worth staring at</h2></div>
        <div className="primerGrid">
          <article><b>{projectionGap.toFixed(1)}</b><span>PROJECTED POINT GAP</span><p>{projectedLeader.team} enters with the higher live projection. Close enough to remain socially dangerous.</p></article>
          <article><b>{left.record} / {right.record}</b><span>RECORDS</span><p>{leftProfile.note}</p></article>
          <article><b>{leftStatuses + rightStatuses}</b><span>STARTER STATUS FLAGS</span><p>{leftStatuses?leftProfile.team+' has '+leftStatuses+'. ':''}{rightStatuses?rightProfile.team+' has '+rightStatuses+'.':''}{!leftStatuses&&!rightStatuses?'No active starter status flags on file.':''}</p></article>
        </div>
      </section>

      <section className="managerPreview">
        <div className="matchupSectionHead"><small>MANAGER FILES</small><h2>The people responsible</h2></div>
        <div className="managerGrid">
          {[ [leftProfile,left], [rightProfile,right] ].map(([profile,ops])=><article key={profile.id}>
            <div className="managerTeamLine"><span>{profile.team}</span><b>{ops.record}</b></div>
            <h3>{profile.owners}</h3>
            <p>{profile.lore}</p>
            <div className="managerPeople">{profile.people.map(person=><div key={person.name}><b>{person.name}</b><span>{person.title}</span><small>{person.aliases}</small></div>)}</div>
            <div className="managerTendencies"><small>ON FILE</small>{profile.tendencies.slice(0,3).map(item=><span key={item}>{item}</span>)}</div>
            <Link href={`/teams/${profile.id}`}>OPEN FRANCHISE DOSSIER →</Link>
          </article>)}
        </div>
      </section>

      <section className="lineupPreview">
        <div className="matchupSectionHead"><small>ACTUAL MATCHUP</small><h2>Starting lineups</h2></div>
        <div className="lineupTeams"><span>{left.teamName}</span><span>{right.teamName}</span></div>
        <div className="lineupRows">
          {rows.map(([lp,rp],index)=>{const lt=trendFor(lp),rt=trendFor(rp);return <div className="lineupRow" key={index}>
            <div className={`lineupPlayer left ${lt?lt.type:''}`}><small>{lp?.slot||'—'}</small><b>{lp?.name||'—'}</b><span>{lp?fmt(lp.weekPoints):'—'} PTS</span>{lt&&<mark className={`trendBadge ${lt.type}`}>{lt.label}<i>{lt.detail}</i></mark>}{lp?.status&&<em>{lp.status}</em>}</div>
            <div className="lineupVs">VS</div>
            <div className={`lineupPlayer right ${rt?rt.type:''}`}><small>{rp?.slot||'—'}</small><b>{rp?.name||'—'}</b><span>{rp?fmt(rp.weekPoints):'—'} PTS</span>{rt&&<mark className={`trendBadge ${rt.type}`}>{rt.label}<i>{rt.detail}</i></mark>}{rp?.status&&<em>{rp.status}</em>}</div>
          </div>})}
        </div>
      </section>

      <section className="matchupBottom">
        <div><small>INSTITUTIONAL POSTURE</small><b>{leftProfile.posture}</b></div>
        <div><small>INSTITUTIONAL POSTURE</small><b>{rightProfile.posture}</b></div>
      </section>
      <Link className="matchupBack" href="/#scores">← ALL WEEK {leagueSnapshot.week} MATCHUPS</Link>
    </main>
  </>
}
