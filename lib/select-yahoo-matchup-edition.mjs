const findArchive=(archives,editionSlug,week)=>archives.map(entries=>entries[editionSlug]).find(entry=>entry?.week===Number(week));

const gamesFor=edition=>edition?.snapshots?.matchups?.data?.data?.matchups??[];

// Teams have provider IDs scoped to the edition; accept either URL orientation.
export function findYahooMatchup(games,a,b) {
  if (a==null || b==null || String(a)===String(b)) return undefined;
  const left=String(a),right=String(b);
  return games.find(game=>{
    const home=String(game.home?.teamId),away=String(game.away?.teamId);
    return (home===left&&away===right)||(home===right&&away===left);
  });
}

// Explicit weeks never fall back. Bare legacy URLs prefer a current pairing,
// then resolve only if exactly one verified archived week contains that pair.
export function selectYahooMatchupEdition({currentEdition,requested,editionSlug,archivedEditions,a,b}) {
  const currentWeek=Number(currentEdition?.snapshots?.matchups?.data?.data?.matchupWeek);
  if (requested!==0) {
    if (!Number.isSafeInteger(requested)||requested<1) return null;
    if (requested===currentWeek) return currentEdition;
    const archived=findArchive(archivedEditions,editionSlug,requested);
    return archived ? {...currentEdition,snapshots:archived.snapshots} : null;
  }
  if (a==null || b==null || findYahooMatchup(gamesFor(currentEdition),a,b)) return currentEdition;
  const matches=archivedEditions.map(entries=>entries[editionSlug]).filter(entry=>{
    if (!Number.isSafeInteger(entry?.week) || entry.week===currentWeek) return false;
    const data=entry.snapshots?.matchups?.data?.data;
    return Number(data?.matchupWeek)===entry.week && findYahooMatchup(gamesFor(entry),a,b)?.status==='final';
  });
  return matches.length===1 ? {...currentEdition,snapshots:matches[0].snapshots} : null;
}

// Offer a link only if the exact edition, week and pairing have complete archive data.
export function hasYahooArchivedMatchup({archivedEditions,editionSlug,week,game}) {
  const home=String(game.home?.teamId??'');
  const away=String(game.away?.teamId??'');
  const archive=findArchive(archivedEditions,editionSlug,week);
  return Boolean(archive?.snapshots?.matchups?.data?.data?.matchups?.some(g=>
    String(g.home?.teamId)===home&&String(g.away?.teamId)===away));
}
