import Link from 'next/link';
import {writers} from '../articles/writers';
import matchupColumns from '../../data/week5-matchup-columns.json';

// Full approved columns are deliberately visible in the Scores section.
// Team IDs and edition slug prevent cross-league copy from appearing.
export default function MatchupEditorialColumns({edition,week,matchups=[],root=''}){
  // Published editorial is independent of transient scoreboard snapshots. A missing
  // pairing must not hide an approved column from the entire edition.
  const entries=matchupColumns.filter(c=>c.edition===edition&&Number(c.week)===Number(week)).map(column=>{
    const game=matchups.find(g=>{
      const a=String(g.home?.teamId??g.home?.id??''),b=String(g.away?.teamId??g.away?.id??'');
      return column.teamIds.includes(a)&&column.teamIds.includes(b);
    });
    const a=column.teamIds[0],b=column.teamIds[1];
    const href=edition==='loog'?(game?.href||null):`${root}/matchups/${a}/${b}`;
    const teams=game?[game.home?.teamName||game.home?.name,game.away?.teamName||game.away?.name]:[];
    return {...column,href,teams};
  });
  if(!entries.length)return null;
  return <section aria-label="Written correspondent matchup breakdowns" className="matchupWrittenColumns" style={{marginTop:36,borderTop:'4px solid #141414',paddingTop:16}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'baseline',flexWrap:'wrap',marginBottom:20}}>
      <div><small style={{letterSpacing:2,fontWeight:800,color:'#af2328'}}>THE BRIEF • WRITTEN MATCHUP REPORTS</small><h3 style={{fontFamily:'Georgia,serif',fontSize:'clamp(24px,3vw,36px)',margin:'8px 0'}}>Week {week}: From the correspondents</h3></div>
      <small style={{fontWeight:700}}>SIX MATCHUPS • SIX PERSPECTIVES</small>
    </div>
    <div style={{display:'grid',gap:30}}>
      {entries.map(c=>{const w=writers[c.writer];return <article key={c.videoId} style={{paddingBottom:25,borderBottom:'1px solid #d8d3cd'}}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:10}}>
          {w?.image&&<img alt="" src={w.image} width="46" height="46" style={{width:46,height:46,borderRadius:'50%',objectFit:'cover'}}/>}
          <div><small style={{display:'block',letterSpacing:1.2,fontSize:11,fontWeight:800,color:'#a82127'}}>{w?.name||'THE NEWSROOM'} • PREGAME COLUMN</small><small style={{fontSize:12}}>{c.teams.length?c.teams.join(' vs. '):'WEEK '+week+' • MATCHUP REPORT'}</small></div>
        </div>
        <h4 style={{fontFamily:'Georgia,serif',fontSize:'clamp(21px,2.5vw,29px)',margin:'8px 0 14px',lineHeight:1.2}}>{c.headline}</h4>
        <div style={{maxWidth:'76ch',fontFamily:'Georgia,serif',fontSize:16,lineHeight:1.75}}>
          {c.body.split(/\n\n+/).map((paragraph,i)=><p key={i} style={{margin:'0 0 13px'}}>{paragraph}</p>)}
        </div>
        {c.href&&<Link href={c.href} style={{fontSize:12,fontWeight:800,letterSpacing:0.8,color:'#ad2028'}}>OPEN FULL MATCHUP →</Link>}
      </article>})}
    </div>
  </section>;
}
