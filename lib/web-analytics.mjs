// Only the live project's production build collects pageviews. Preview builds
// also use NODE_ENV=production, so NODE_ENV alone is not sufficient.
export function analyticsEnabled(env) {
  return env.NODE_ENV === 'production' && env.VERCEL_ENV === 'production' &&
    env.VERCEL_PROJECT_ID === 'prj_h89MCmxn3Mr3O0wRpnwstM917E0l' &&
    env.BRIEF_ENV !== 'staging' && env.NEXT_PUBLIC_BRIEF_ENV !== 'staging';
}

export const OPT_OUT_KEY = 'brief.analytics.opt-out';

export function beforeSendPageview(event) {
  if (typeof window === 'undefined' || event.type !== 'pageview') return null;
  try {
    // Read on every event: other tabs and preferences changes take effect now.
    if (window.localStorage.getItem(OPT_OUT_KEY) === '1') return null;
    const url = new URL(event.url);
    if (url.origin !== window.location.origin) return null;
    const path = url.pathname.replace(/\/$/, '') || '/';
    if (!['/', '/sunday-crew', '/doge'].includes(path) &&
        !/^\/(?:sunday-crew\/|doge\/)?articles\/[a-z0-9-]+$/.test(path)) return null;
    url.pathname = path;
    url.search = '';
    url.hash = '';
    return { ...event, url: url.toString() };
  } catch {
    // Unavailable storage or malformed URLs must not bypass the exclusion.
    return null;
  }
}
