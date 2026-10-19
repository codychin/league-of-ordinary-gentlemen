// Emergency stop only; normal opening and closing follow the New York Sunday window.
export const LIVE_DESK_ENABLED = true;
// The intended schedule is separate from the emergency stop; this does not enable it.
export function isSundayDeskScheduledWindow(now = new Date()) {
  // One-time owner-approved window. No future Sunday is authorized.
  const time = now.getTime();
  return time >= Date.parse('2026-10-18T13:30:00Z') && time < Date.parse('2026-10-19T04:00:00Z');
}
export function isSundayLiveWindow(now = new Date()) {
  return LIVE_DESK_ENABLED && isSundayDeskScheduledWindow(now);
}

