// Emergency stop only; normal opening and closing follow the New York Sunday window.
export const LIVE_DESK_ENABLED = false;
// The intended schedule is separate from the emergency stop; this does not enable it.
export function isSundayDeskScheduledWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const part = type => parts.find(p => p.type === type)?.value;
  return part('weekday') === 'Sun' && Number(part('hour')) * 60 + Number(part('minute')) >= 630;
}
export function isSundayLiveWindow(now = new Date()) {
  return LIVE_DESK_ENABLED && isSundayDeskScheduledWindow(now);
}

