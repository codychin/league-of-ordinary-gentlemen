'use client';
import Link from 'next/link';
import ResilientImage from './ResilientImage';

export default function MatchupCardGrid({cards=[]}){
  return <div className="briefMatchupGrid">{cards.map((c,i)=><Link className="briefMatchupLink" href={c.href} key={c.id||i}>
    <article className="briefMatchupCard">
      <small className="briefMatchupKicker">{c.status==='FINAL'?'FINAL':c.kicker||'OPEN MATCHUP'}</small>
      <div className="briefMatchupTeams">
        <div className="briefMatchupSide"><b>{c.leftName}</b><strong>{c.leftScore??"—"}</strong>{c.status!=='FINAL'&&<em>{c.leftProjection!=null?`${c.leftProjection} PROJECTED`:'POINTS'}</em>}</div>
        <i>VS</i>
        <div className="briefMatchupSide briefMatchupRight"><b>{c.rightName}</b><strong>{c.rightScore??"—"}</strong>{c.status!=='FINAL'&&<em>{c.rightProjection!=null?`${c.rightProjection} PROJECTED`:'POINTS'}</em>}</div>
      </div>
      <div className="briefMatchupPortraits" aria-hidden="true">
        {c.leftImage&&<ResilientImage loading="lazy" decoding="async" className="briefMatchupLeftPlayer" src={c.leftImage} alt=""/>}
        {c.rightImage&&<ResilientImage loading="lazy" decoding="async" className="briefMatchupRightPlayer" src={c.rightImage} alt=""/>}
      </div><span className="briefMatchupOpen">OPEN MATCHUP & READ CORRESPONDENT WRITEUP →</span>
    </article>
  </Link>)}</div>;
}
