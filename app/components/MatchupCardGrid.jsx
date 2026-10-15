'use client';
import Link from 'next/link';

export default function MatchupCardGrid({cards=[]}){
  return <div className="briefMatchupGrid">{cards.map((c,i)=><Link className="briefMatchupLink" href={c.href} key={c.id||i}>
    <article className="briefMatchupCard">
      <small className="briefMatchupKicker">{c.status==='FINAL'?'FINAL':c.kicker||'OPEN MATCHUP'}</small>
      <div className="briefMatchupTeams">
        <div className="briefMatchupSide"><b>{c.leftName}</b><strong>{c.leftScore??"—"}</strong>{!['FINAL','PENDING'].includes(c.status)&&<em>{c.leftProjection!=null?`${c.leftProjection} PROJECTED`:'POINTS'}</em>}</div>
        <i>VS</i>
        <div className="briefMatchupSide briefMatchupRight"><b>{c.rightName}</b><strong>{c.rightScore??"—"}</strong>{!['FINAL','PENDING'].includes(c.status)&&<em>{c.rightProjection!=null?`${c.rightProjection} PROJECTED`:'POINTS'}</em>}</div>
      </div>
      <span className="briefMatchupOpen">Matchup →</span>
    </article>
  </Link>)}</div>;
}
