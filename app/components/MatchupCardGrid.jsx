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
      </div>
      {c.columnHeadline&&<div className="briefMatchupEditorial" style={{borderTop:'1px solid #d8d3cd',paddingTop:12,marginTop:12}}><small style={{fontWeight:750,letterSpacing:1.1,fontSize:10,color:'#a82127'}}>THE CORRESPONDENT'S READ • {c.columnAuthor}</small><p style={{fontFamily:'Georgia,serif',fontSize:16,lineHeight:1.32,margin:'6px 0 0'}}>{c.columnHeadline}</p></div>}<span className="briefMatchupOpen">OPEN MATCHUP →</span>
    </article>
  </Link>)}</div>;
}
