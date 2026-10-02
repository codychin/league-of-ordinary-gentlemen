'use client';
import Link from 'next/link';
import ResilientImage from './ResilientImage';

export default function MatchupCardGrid({cards=[]}){
  return <div className="briefMatchupGrid">{cards.map((c,i)=><Link className="briefMatchupLink" href={c.href} key={c.id||i}>
    <article className="briefMatchupCard">
      <small className="briefMatchupKicker">{c.kicker||'OPEN MATCHUP'}</small>
      <div className="briefMatchupTeams">
        <div className="briefMatchupSide"><b>{c.leftName}</b><em>{c.leftProjection} PROJECTED</em></div>
        <i>VS</i>
        <div className="briefMatchupSide briefMatchupRight"><b>{c.rightName}</b><em>{c.rightProjection} PROJECTED</em></div>
      </div>
      <div className="briefMatchupPortraits" aria-hidden="true">
        {c.leftImage&&<ResilientImage className="briefMatchupLeftPlayer" src={c.leftImage} alt=""/>}
        {c.rightImage&&<ResilientImage className="briefMatchupRightPlayer" src={c.rightImage} alt=""/>}
      </div>
      <span className="briefMatchupOpen">OPEN MATCHUP →</span>
    </article>
  </Link>)}</div>;
}