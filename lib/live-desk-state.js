// Emergency stop only; normal opening and closing follow the New York Sunday window.
export const LIVE_DESK_ENABLED = false;
export function isSundayLiveWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const part = type => parts.find(p => p.type === type)?.value;
  return LIVE_DESK_ENABLED && part('weekday') === 'Sun' && Number(part('hour')) >= 9;
}
