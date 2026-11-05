/** Stable, readable source timestamps, explicitly in the league's Eastern time. */
export function formatMatchupTimestamp(value) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  }).format(date);
}
