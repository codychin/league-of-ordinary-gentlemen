// Keep application/unknown failures fatal. Only this independently traced X
// iframe defect is classified separately, with its complete stack retained.
export function isKnownXEmbedAppendChildError(error) {
  if (!/^(?:TypeError: )?Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'\.$/.test(error.message || '')) return false;
  const frames = String(error.stack || '').split('\n').slice(1).map(s=>s.trim()).filter(Boolean);
  return frames.length > 0 && frames.every(frame =>
    /^at (?:[^\s]+ \()?https:\/\/platform\.twitter\.com\/embed\/[^\s)]+(?::\d+){1,2}\)?$/.test(frame));
}
