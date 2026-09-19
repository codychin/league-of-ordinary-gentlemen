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
const activeRoster=team=>team.roster.filter(player=>player.slot!=='Bench'&&player.slot!=='IR')
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
  'pollard-greens:skatt':{
    writer:'kells',
    title:'This Game Has Too Many Personal Brands and Not Enough Stability',
    body:"Pollard Greens brings Big Citrus, Earthsherm Jam and a receiver room that already looks like it has a publicist. I’m a Skatt Man counters with Yonjuries, The Count and enough medical ambiguity to support a docuseries. The matchup itself is competitive. The surrounding mythology is doing considerably more work."
  },
  'kraft:kupp-doubs':{
    writer:'march',
    title:'A Quiet Bilateral Summit Between Two Functional Governments',
    body:"For the Love of the Kraft and Kupp Kupp Doubs arrive without a constitutional crisis, which in this league qualifies as a diplomatic breakthrough. Tish has spent the opening weeks practicing quiet competence. Roy Bird has kept an emergency stockpile of bench points. The question is whether restraint can survive four quarters of fantasy football without producing an incident."
  },
  'all-ugly:lloyd-rings':{
    writer:'gannon',
    title:'The Process Game',
    body:"All Ugly’s Week 1 loss was the kind of result that makes process people unbearable because the process was, irritatingly, mostly fine. Lloyd of the Rings is the opposite problem: a family office getting enormous production from veteran stars and daring you to call it unsustainable. This one is less about who drafted the prettier roster than who gets the correct decisions from the players they already have."
  },
  'route-22:shake-baker':{
    writer:'pike',
    title:'One Team Wants Every Asset. The Other Has Six Names.',
    body:"Route 22 treats roster construction like a permanently open capital market. Shake ’N Baker treats identity like a holding company. Choe and Gerstone will spend the week evaluating everybody else’s assets while Seth Waldenberg’s alias complex attempts to establish which executive is actually responsible for the lineup. Somewhere underneath all of that, there is a very real football game."
  },
  'hopkins-opus:royrek':{
    writer:'sorrell',
    title:'Power, Confidence and the League’s Two Most Convenient Institutions',
    body:"Kash enters with the most valuable political asset in fantasy football: a recent overwhelming victory and the willingness to mention it. Royrek enters with a different kind of institutional advantage, one in which the owner of record and the draft authority have never been forced into a particularly uncomfortable public accounting. Both teams are talented. More importantly, both organizations understand narrative control."
  },
  'ceedeep:danir':{
    writer:'crane',
    title:'The Quarterback Had Already Done His Part',
    body:"By the time I got to this file, Josh Allen had already scored enough points to make Sunday feel optional and Danir had already spent two weeks collecting evidence that the correct lineup exists somewhere nearby, usually on the bench. The numbers say CeeDeep has the edge. The history says Danir is fully capable of turning a reasonable football decision into a three-day inquiry."
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
