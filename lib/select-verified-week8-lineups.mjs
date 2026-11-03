import {isMatchupFinal} from './matchup-status.mjs';

// Use historical player points only when the selected final is exactly the
// matchup and score supported by the retained Week 8 provider evidence.
export function selectVerifiedWeek8Lineups({season,week,game,evidence}) {
  if (Number(season)!==2026 || Number(week)!==8 || evidence?.week!==8 || evidence?.season!==2026 ||
      evidence?.leagueId!=='310731' || !isMatchupFinal(game) ||
      !['HOME','AWAY','TIE'].includes(game?.winner) || !Array.isArray(evidence.playerMatchups)) return [];
  const gameIds=[Number(game.home?.id),Number(game.away?.id)];
  if (!gameIds.every(Number.isFinite) || gameIds[0]===gameIds[1]) return [];
  const matches=evidence.playerMatchups.filter(m=>m.matchupPeriodId===8 &&
    gameIds.includes(Number(m.home?.teamId)) && gameIds.includes(Number(m.away?.teamId)) &&
    Number(m.home?.teamId)!==Number(m.away?.teamId));
  if (matches.length!==1) return [];
  const source=matches[0];
  if (!Array.isArray(evidence.matchups)) return [];
  const summaries=evidence.matchups.filter(m=>m.matchupPeriodId===8 &&
    gameIds.includes(Number(m.home?.teamId)) && gameIds.includes(Number(m.away?.teamId)) &&
    Number(m.home?.teamId)!==Number(m.away?.teamId));
  if (summaries.length!==1 || !['HOME','AWAY','TIE'].includes(summaries[0].winner)) return [];
  const summary=summaries[0];
  // Resolve the winner by team identity so reversed home/away orientation is safe.
  const sourceWinner=summary.winner==='TIE'?'TIE':Number(summary[summary.winner.toLowerCase()].teamId);
  const gameWinner=game.winner==='TIE'?'TIE':Number(game[game.winner.toLowerCase()]?.id);
  if (sourceWinner!==gameWinner) return [];
  const result=[];
  for(const side of [source.home,source.away]) {
    const scoreSide=[game.home,game.away].find(s=>Number(s?.id)===Number(side.teamId));
    const summarySide=[summary.home,summary.away].find(s=>Number(s?.teamId)===Number(side.teamId));
    const score=scoreSide?.score, total=side.totalPoints, summaryTotal=summarySide?.totalPoints;
    if (typeof score!=='number'||typeof total!=='number'||typeof summaryTotal!=='number'||
        !Number.isFinite(score)||!Number.isFinite(total)||!Number.isFinite(summaryTotal)||
        Math.abs(score-total)>0.001||Math.abs(score-summaryTotal)>0.001||!Array.isArray(side.players)) return [];
    const starters=side.players.filter(p=>p.started===true);
    if (starters.length!==10 || new Set(starters.map(p=>p.playerId)).size!==10 ||
        starters.some(p=>!p.playerId || !p.name || !p.lineupSlot || typeof p.points!=='number' || !Number.isFinite(p.points)) ||
        Math.abs(starters.reduce((sum,p)=>sum+p.points,0)-total)>0.001) return [];
    result.push(side);
  }
  return result;
}
