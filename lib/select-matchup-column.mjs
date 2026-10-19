// Recaps are keyed by season, edition, week and the unordered pair of teams.
// A provider-final result must never fall back to a pregame prediction.
export function selectMatchupColumn({previews=[],recaps=[],season=2026,edition,week,a,b,isFinal}) {
  const matches=c=>c.edition===edition&&Number(c.season??2026)===Number(season)&&Number(c.week)===Number(week)&&c.teamIds?.length===2&&String(a)!==String(b)&&c.teamIds.map(String).includes(String(a))&&c.teamIds.map(String).includes(String(b));
  return (isFinal?recaps:previews).find(c=>matches(c)&&(isFinal?c.kind==='recap':c.kind==='pregame'))||null;
}
