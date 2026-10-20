import selections from '../../data/week6-start-sit.json';
const names={loog:'LOOG','sunday-crew':'SUNDAY CREW',doge:'DOGE4'};
const points=n=>Number(n).toFixed(2).replace(/\.00$/, '');
export default function StartSitOfWeek({edition='loog',headshots={}}) {
 const data=selections[edition];
 if(!data||data.status!=='FINAL')return null;
 return <section className="decisionDesk section"><div className="sectionhead"><div><small className="deskLabel">THE DECISION DESK</small><h2>Start / Sit of the Week</h2></div><span>WEEK {data.week} • {names[edition]} RETROSPECTIVE • FINAL • REVIEWED AFTER THE FACT</span></div><div className="decisionGrid">{data.picks.map(p=><article className={p.type==='start'?'startPick':'sitPick'} key={p.type}><div className="decisionPhoto">{(edition==='loog'||headshots[p.playerId])&&<img loading="lazy" decoding="async" src={edition==='loog'?`https://a.espncdn.com/i/headshots/nfl/players/full/${p.playerId}.png`:headshots[p.playerId]} alt={p.player}/>}<span>{p.player.toUpperCase()}</span></div><small>{p.type==='start'?'START OF THE WEEK':'SIT OF THE WEEK'}</small><b>{names[edition]} • {p.team}</b>{p.headline&&<h3>{p.headline}</h3>}<h3>{p.player} — {points(p.points)}, {p.slot}</h3><p>{p.body}</p><strong>VERDICT: {points(p.gap)} POINTS {p.type==='start'?'OVER THE BENCH ALTERNATIVE':'LEFT ON THE BENCH'}</strong></article>)}</div></section>;
}
