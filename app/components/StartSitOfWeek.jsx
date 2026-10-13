import closeout from '../../data/week5-closeout.json';

const EDITION_PICKS = {
  'sunday-crew': {
    league: 'SUNDAY CREW',
    source: 'sundayCrew',
    start: {team: 'ZAYWATCH', player: 'Parker Washington', slot: 'WR', alternative: 'Dohnte Meyers', comment: 'Sandy found 31.4 points in Parker Washington while Dohnte Meyers supplied 2.2 on the bench. ZAYWATCH beat CHANE GANG 147.64–91.98. The lead was already safe; the personnel decision was just exceptionally rude.'},
    sit: {team: 'Tolbert’s Cookies', player: 'Braelon Allen', slot: 'W/R/T', alternative: 'Bhayshul Tuten', comment: 'Allen put up 20.1 from the bench while Bhayshul Tuten contributed 10.6 in the starting lineup. Tolbert’s Cookies lost to Croatian Sensation 147.26–131.52. A 9.5-point substitution would not have reversed the result, but it would have made the last page of the autopsy less bleak.'}
  },
  doge: {
    league: 'DOGE4',
    source: 'doge',
    start: {team: 'Jerruh’s World', player: 'Christian Watson', slot: 'WR', alternative: 'Kalif Raymond', comment: 'Watson delivered 33.3 from a starting receiver slot against 1.9 from reserve Kalif Raymond. Jerruh’s World beat McConkey Kong 170.52–119.44. The victory was emphatic enough without the extra 31.4 points of personnel vindication.'},
    sit: {team: 'T. Ocellus', player: 'Kyle Pitts Sr.', slot: 'TE', alternative: 'T.J. Hockenson', comment: 'Pitts scored 12.7 on the bench while Hockenson managed 1.2 as the starting tight end. Ocellus lost to Extremely Tight Ends 111.36–78.20. The unused 11.5 points could not save the day, but they are certainly eligible for the evidence locker.'}
  }
};
const asPoints = n => Number(n).toFixed(2).replace(/\\.00$/, '');
function lookup(league, team, name) {
  const roster = league.rosters.find(r => r.teamName === team);
  return roster?.players.find(p => p.name === name);
}
function EditionPick({league, data, type, headshots}) {
  const starter = lookup(league, data.team, data.player);
  const alternative = lookup(league, data.team, data.alternative);
  if (!starter || !alternative) return null;
  const delta = Math.abs(Number(starter.points) - Number(alternative.points));
  const image = headshots?.[String(starter.playerId)];
  const isStart = type === 'start';
  return <article className={isStart ? 'startPick' : 'sitPick'}>
    <div className="decisionPhoto">{image ? <img loading="lazy" decoding="async" src={image} alt={starter.name}/> : null}<span>{starter.name.toUpperCase()}</span></div>
    <small>{isStart ? 'START OF THE WEEK' : 'SIT OF THE WEEK'}</small>
    <b>{data.team}</b>
    <h3>{starter.name} — {asPoints(starter.points)}, {isStart ? data.slot : 'bench'}</h3>
    <p>{data.comment}</p>
    <strong>VERDICT: {asPoints(delta)} POINTS {isStart ? 'OVER THE BENCH ALTERNATIVE' : 'LEFT ON THE BENCH'}</strong>
  </article>;
}
function EditionStartSit({slug,headshots}) {
  const config = EDITION_PICKS[slug];
  const league = closeout[config.source];
  if (!league || closeout.week !== 5 || closeout.status !== 'FINAL') return null;
  return <section className="decisionDesk section"><div className="sectionhead"><div><small className="deskLabel">THE DECISION DESK</small><h2>Start / Sit of the Week</h2></div><span>WEEK 5 • {config.league} RETROSPECTIVE • FINAL • MANAGERIAL JUDGMENT / REVIEWED AFTER THE FACT</span></div><div className="decisionGrid"><EditionPick league={league} data={config.start} type="start" headshots={headshots}/><EditionPick league={league} data={config.sit} type="sit" headshots={headshots}/></div></section>;
}

export default function StartSitOfWeek({edition='loog',headshots={}}){if(EDITION_PICKS[edition])return <EditionStartSit slug={edition} headshots={headshots}/>;return return <section className="decisionDesk section"><div className="sectionhead"><div><small className="deskLabel">THE DECISION DESK</small><h2>Start / Sit of the Week</h2></div><span>WEEK 5 • LOOG RETROSPECTIVE • FINAL • MANAGERIAL JUDGMENT / REVIEWED AFTER THE FACT</span></div><div className="decisionGrid"><article className="startPick"><div className="decisionPhoto"><img loading="lazy" decoding="async" src="https://a.espncdn.com/i/headshots/nfl/players/full/4685247.png" alt="Braelon Allen"/><span>BRAELON ALLEN</span></div><small>START OF THE WEEK</small><b>LOOG • Mr Hopkins Opus</b><h3>Braelon Allen — 25.0, FLEX</h3><p>Hopkins started Allen and beat All Ugly 174.90–141.24. Will Shipley, the highest-scoring eligible bench alternative, supplied 7.8. Bucky Irving added 37.6, because apparently one correct running-back decision was not sufficient for the press release.</p><strong>VERDICT: 17.2 POINTS OVER THE BEST ELIGIBLE BENCH ALTERNATIVE</strong></article><article className="sitPick"><div className="decisionPhoto"><img loading="lazy" decoding="async" src="https://a.espncdn.com/i/headshots/nfl/players/full/4426348.png" alt="Jayden Daniels"/><span>JAYDEN DANIELS</span></div><small>SIT OF THE WEEK</small><b>LOOG • Shake ’N Baker</b><h3>Jayden Daniels — 35.16, bench</h3><p>Daniels watched Jacoby Brissett score 24.48 in a 143.12–141.28 loss to Lloyd. The 10.68-point upgrade would have turned defeat into an 8.84-point win. Retrospective lineup science is cheap; this particular receipt is not.</p><strong>VERDICT: 10.68 POINTS UNUSED • LOST BY 1.84</strong></article></div></section>;}
