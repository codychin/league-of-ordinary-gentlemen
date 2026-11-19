const findArchive=(archives,editionSlug,week)=>archives.map(entries=>entries[editionSlug]).find(entry=>entry?.week===Number(week));

// Keep a requested week and its roster/standings together within one Yahoo edition.
export function selectYahooMatchupEdition({currentEdition,requested,editionSlug,archivedEditions}) {
  const currentWeek=Number(currentEdition?.snapshots?.matchups?.data?.data?.matchupWeek);
  if (!requested || requested===currentWeek) return currentEdition;
  const archived=findArchive(archivedEditions,editionSlug,requested);
  return archived ? {...currentEdition,snapshots:archived.snapshots} : null;
}

// Offer a link only if the exact edition, week and pairing have complete archive data.
export function hasYahooArchivedMatchup({archivedEditions,editionSlug,week,game}) {
  const home=String(game.home?.teamId??'');
  const away=String(game.away?.teamId??'');
  const archive=findArchive(archivedEditions,editionSlug,week);
  return Boolean(archive?.snapshots?.matchups?.data?.data?.matchups?.some(g=>
    String(g.home?.teamId)===home&&String(g.away?.teamId)===away));
}
