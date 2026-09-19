import Link from 'next/link'
import SiteNav from '../../../components/SiteNav'
import {leagueSnapshot} from '../../../teams/league-data'
import {teams} from '../../../teams/data'

const fmt=value=>{
  const n=Number(value)
  if(!Number.isFinite(n)) return '—'
  return n.toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1')
}
const activeRoster=team=>team.roster.filter(player=>player.slot!=='Bench'&&player.slot!=='IR')
const profileFor=id=>teams.find(team=>team.id===id)

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

  return <>
    <header className="articleHeader"><Link href="/" className="miniMast">The Brief of Ordinary Gentleman</Link><SiteNav/></header>
    <main className="matchupPage">
      <section className="matchupLead">
        <div className="matchupKicker">WEEK {leagueSnapshot.week} • GAME PREVIEW</div>
        <div className="matchupScoreboard">
          <Link href={`/teams/${a}`} className="matchupSide">
            <small>{leftProfile.owners}</small>
            <h1>{left.teamName}</h1>
            <b>{fmt(left.matchup.score)}</b>
            <span>PROJECTED {left.matchup.projection}</span>
          </Link>
          <div className="matchupCenter"><span>VS</span><small>LIVE</small></div>
          <Link href={`/teams/${b}`} className="matchupSide right">
            <small>{rightProfile.owners}</small>
            <h1>{right.teamName}</h1>
            <b>{fmt(right.matchup.score)}</b>
            <span>PROJECTED {right.matchup.projection}</span>
          </Link>
        </div>
        <div className="matchupUpdated">LIVE SNAPSHOT • {leagueSnapshot.updatedAt}</div>
      </section>

      <section className="matchupPrimer">
        <div className="matchupSectionHead"><small>THE BRIEF'S READ</small><h2>Before Sunday gets involved</h2></div>
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
          {rows.map(([lp,rp],index)=><div className="lineupRow" key={index}>
            <div className="lineupPlayer left"><small>{lp?.slot||'—'}</small><b>{lp?.name||'—'}</b><span>{lp?fmt(lp.weekPoints):'—'} PTS</span>{lp?.status&&<em>{lp.status}</em>}</div>
            <div className="lineupVs">VS</div>
            <div className="lineupPlayer right"><small>{rp?.slot||'—'}</small><b>{rp?.name||'—'}</b><span>{rp?fmt(rp.weekPoints):'—'} PTS</span>{rp?.status&&<em>{rp.status}</em>}</div>
          </div>)}
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
