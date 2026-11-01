export function scoreStripPhase(data,scheduledPhase){
  const games=data?.matchups||[];
  if(data?.status==='FINAL'||(games.length&&games.every(g=>g.winner&&g.winner!=='UNDECIDED')))return 'FINAL';
  if(games.some(g=>Number(g.home?.score)!==0&&Number.isFinite(Number(g.home?.score))||Number(g.away?.score)!==0&&Number.isFinite(Number(g.away?.score))))return 'WEEK IN PROGRESS';
  return scheduledPhase==='PREGAME'?'PREGAME':'AWAITING POINTS';
}
