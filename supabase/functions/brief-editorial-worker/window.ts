// Standing owner authorization: Sunday 10:30 through midnight America/Detroit.
export function isSundayDeskScheduledWindow(now = new Date()) {
  if (!Number.isFinite(now.getTime())) return false;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Detroit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).map(({type, value}) => [type, value]));
  return parts.weekday === 'Sun' && Number(parts.hour) * 60 + Number(parts.minute) >= 630;
}
