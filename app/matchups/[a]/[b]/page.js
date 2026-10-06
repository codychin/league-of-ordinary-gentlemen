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
export default async function MatchupPreview({params}){
  const {a,b}=await params
  let left=leagueSnapshot.teams[a]
  let right=leagueSnapshot.teams[b]
  const liveWeek=leagueSnapshot.week;
  const leftProfile=profileFor(a),rightProfile=profileFor(b);
  if(!left||!right||!leftProfile||!rightProfile){
    return <main className="matchupPage"><h1>Matchup not found.</h1><Link href="/#scores">Return to scores</Link></main>
  }

  const leftStarters=activeRoster(left)
  const rightStarters=activeRoster(right)
  const rows=Array.from({length:Math.max(leftStarters.length,rightStarters.length)},(_,index)=>[leftStarters[index],rightStarters[index]])
  const projectionGap=Math.abs(Number(left.matchup.score)-Number(right.matchup.score));
  const projectedLeader=Number(left.matchup.score)>=Number(right.matchup.score)?leftProfile:rightProfile;
  const leftStatuses=leftStarters.filter(player=>player.status).length;
  const rightStatuses=rightStarters.filter(player=>player.status).length;
  const preview={writer:'gannon',title:`${projectedLeader.team} takes Week ${liveWeek}.`,body:`${left.teamName} finished with ${fmt(left.matchup.score)}; ${right.teamName} finished with ${fmt(right.matchup.score)}. The final margin was ${projectionGap.toFixed(2)} points. ${leftProfile.note}`};
  const writer=writers[preview.writer]

  return <>
    <header className="articleHeader"><Link href="/" className="miniMast">The Brief of Ordinary Gentleman</Link><SiteNav/></header>
    <main className="matchupPage">
      <section className="matchupLead">
        <div className="matchupHeroKicker">WEEK {liveWeek} • FINAL RESULT</div>
        <div className="matchupScoreboard">
          <Link href={`/teams/${a}`} className="matchupHeroSide">
            <small>{leftProfile.owners}</small>
            <h1>{left.teamName}</h1>
            <b>{fmt(left.matchup.score)}</b>
            <span>FINAL</span>
          </Link>
          <div className="matchupHeroCenter"><span>VS</span><small>FINAL</small></div>
          <Link href={`/teams/${b}`} className="matchupHeroSide right">
            <small>{rightProfile.owners}</small>
            <h1>{right.teamName}</h1>
            <b>{fmt(right.matchup.score)}</b>
            <span>FINAL</span>
          </Link>
        </div>
        <div className="matchupUpdated">VERIFIED FINAL • {leagueSnapshot.updatedAt}</div>
      </section>

      <section className="matchupColumn">
        <div className="matchupColumnByline">
          <img src={writer.image} alt={writer.imageAlt}/>
          <div><small>FINAL RESULT • {writer.title.toUpperCase()}</small><b>{writer.name}</b></div>
        </div>
        <h2>{preview.title}</h2>
        <p>{preview.body}</p>
      </section>

      <section className="matchupPrimer">
        <div className="matchupSectionHead"><small>THE BRIEF'S READ</small><h2>Numbers worth staring at</h2></div>
        <div className="primerGrid">
          <article><b>{projectionGap.toFixed(2)}</b><span>FINAL MARGIN</span><p>{projectedLeader.team} won this completed matchup.</p></article>
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
          {rows.map(([lp,rp],index)=>{const lt=null,rt=null;return <div className="lineupRow" key={index}>
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
      <Link className="matchupBack" href="/#scores">← ALL WEEK {liveWeek} MATCHUPS</Link>
    </main>
  </>
}
