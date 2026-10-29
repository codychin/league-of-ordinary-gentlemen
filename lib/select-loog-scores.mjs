import {isMatchupFinal} from './matchup-status.mjs';

// The provider's calendar week can advance before the completed-week reading
// window ends. Use the same selection for the scoreboard API and matchup pages.
export function selectLoogScores({provider,latest,completed,now=Date.now()}) {
  let selected=latest;
  for (const candidate of [completed,provider]) {
    if (!candidate?.ok || !Array.isArray(candidate.matchups) || !candidate.matchups.length) continue;
    if (candidate.season!=null && latest.season!=null && Number(candidate.season)!==Number(latest.season)) continue;
    if (Number(candidate.week)>Number(selected.week) ||
        (Number(candidate.week)===Number(selected.week) && Date.parse(candidate.updatedAt)>Date.parse(selected.updatedAt))) selected=candidate;
  }
  const start=Date.parse(completed?.updatedAt),end=Date.parse(completed?.displayCompletedUntil);
  if (completed?.matchups?.length && completed.matchups.every(isMatchupFinal) &&
      now>=start && now<end && Number(selected.week)>Number(completed.week)) return completed;
  // The legacy score endpoint omits season (see brief-sunday-engine action=scores).
  // Its canonical season is the committed LOOG snapshot used above to reject conflicts.
  return selected.season==null&&latest.season!=null?{...selected,season:latest.season}:selected;
}
