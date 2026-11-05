// Accept only exact-week actual player totals that reconcile with this scorecard.
export function selectCurrentLineups(details,week,game){
 if(!details?.ok||Number(details.week)!==Number(week)||Number(details.season)!==2026)return [];
 return [game.home,game.away].map(side=>{
  const t=details.teams?.find(t=>Number(t.id)===Number(side.id));
  if(!t?.roster?.length)return null;
  const players=t.roster.map(p=>({playerId:p.id,name:p.name,lineupSlot:p.slot,started:p.started===true,points:p.weekPoints}));
  const starters=players.filter(p=>p.started);
  if(starters.length!==10||starters.some(p=>typeof p.points!=='number'||!Number.isFinite(p.points))||Math.abs(starters.reduce((s,p)=>s+p.points,0)-Number(side.score))>0.001)return null;
  return {teamId:Number(t.id),players};
 }).filter(Boolean);
}
