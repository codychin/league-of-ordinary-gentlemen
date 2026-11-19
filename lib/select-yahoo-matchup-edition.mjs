// Keep a requested week and its roster/standings together within one Yahoo edition.
export function selectYahooMatchupEdition({currentEdition,requested,editionSlug,archivedEditions}) {
  const currentWeek=Number(currentEdition?.snapshots?.matchups?.data?.data?.matchupWeek);
  if (!requested || requested===currentWeek) return currentEdition;
  const archived=archivedEditions.map(entries=>entries[editionSlug]).find(entry=>entry?.week===requested);
  return archived ? {...currentEdition,snapshots:archived.snapshots} : null;
}
