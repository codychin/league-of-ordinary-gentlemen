// Deliberate, opt-in PostHog capture. No SDK, autocapture, replay, or remote code.
export const CONSENT_KEY = 'brief-analytics-consent-v1';
export const INTERNAL_KEY = 'brief-analytics-internal-v1';
export const VISITOR_KEY = 'brief-analytics-browser-v1';
const HOSTS = new Set(['ordinarybrief.com', 'www.ordinarybrief.com']);
const INGEST = new Set(['https://us.i.posthog.com', 'https://eu.i.posthog.com']);
const WRITERS = ['maude-gannon','hollis-crane','conrad-sorrell','marnie-kells','sabine-march','dashiell-pike','newsroom'];
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(value) ? value : undefined;
export function writerId(value) {
  const normalized = String(value || '').toLowerCase().replaceAll(' ', '-');
  return WRITERS.find(writer => writer === normalized || writer.endsWith('-' + normalized)) || 'newsroom';
}
export function routeContext(pathname, article = {}) {
  const path = pathname.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  const league = path === '/doge' || path.startsWith('/doge/') ? 'doge' : path === '/sunday-crew' || path.startsWith('/sunday-crew/') ? 'sunday-crew' : 'loog';
  const local = league === 'loog' ? path : path.slice(league.length + 1) || '/';
  if (/^\/(manage|api|auth|login|oauth)(\/|$)/.test(local)) return null;
  if (local.startsWith('/articles/')) {
    // Never infer a local article ID from a URL that may contain a member name.
    if (!safeId(article.id)) return null;
    return {league, page_type:'article', article_id:article.id, correspondent:writerId(article.writer)};
  }
  const type = local === '/' ? 'home' : /^\/(archive|staff|newsroom|corrections|teams|matchups|scores|culture)(\/|$)/.exec(local)?.[1];
  return type ? {league, page_type:type} : null;
}
export function eligible({enabled, environment, hostname, consent, internal, dnt, gpc, webdriver, search = ''}) {
  const query = new URLSearchParams(search);
  return enabled === 'true' && environment === 'production' && HOSTS.has(hostname) && consent === 'granted' && !internal && !gpc && dnt !== '1' && !webdriver && !['app-preview','analytics-test','preview'].some(key => query.has(key));
}
export function makeEvent(event, context, extra = {}) {
  const allowed = new Set(['page_view','article_view','article_read_time','article_scroll','carousel_click','reel_start','reel_complete']);
  if (!allowed.has(event) || !context) return null;
  const properties = {schema_version:1, league:context.league, page_type:context.page_type, $process_person_profile:false, $geoip_disable:true, $ip:'0.0.0.0'};
  if (safeId(context.article_id)) properties.article_id = context.article_id;
  if (context.correspondent) properties.correspondent = writerId(context.correspondent);
  if (safeId(extra.article_id)) properties.article_id = extra.article_id;
  if (safeId(extra.reel_id)) properties.reel_id = extra.reel_id;
  if (extra.correspondent) properties.correspondent = writerId(extra.correspondent);
  if ([25,50,75,100].includes(extra.scroll_percent)) properties.scroll_percent = extra.scroll_percent;
  if (Number.isFinite(extra.active_seconds)) properties.active_seconds = Math.max(0, Math.min(30, Math.floor(extra.active_seconds)));
  if (['recent-stories','roundup','also','feature'].includes(extra.placement)) properties.placement = extra.placement;
  if (safeId(extra.visit_id)) properties.visit_id = extra.visit_id;
  return {event, properties};
}
export function createTransport({token, host, allowed, storage, randomUUID, fetcher}) {
  return (event, context, extra) => {
    if (!allowed() || !/^phc_[a-zA-Z0-9]+$/.test(token || '') || !INGEST.has(host)) return false;
    const payload = makeEvent(event, context, extra);
    if (!payload) return false;
    try {
      let id = storage.getItem(VISITOR_KEY);
      if (!/^[-a-f0-9]{36}$/.test(id || '')) { id = randomUUID(); storage.setItem(VISITOR_KEY,id); }
      // Network-layer IP still reaches PostHog. Disable enrichment, never promise anonymity.
      fetcher(host + '/i/v0/e/', {method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,body:JSON.stringify({api_key:token,distinct_id:id,...payload})}).catch(()=>{});
      return true; // Enqueued, not proof of ingestion. No retry that could duplicate an event.
    } catch { return false; }
  };
}
export function activeDelta({elapsed, visible, focused, idle, inArticle}) {
  return visible && focused && inArticle && idle <= 30000 ? Math.max(0,Math.min(elapsed,5000)) : 0;
}
export function scrollPercent({top,height,viewport}) {
  if (height <= 0 || top >= viewport || top + height <= 0) return 0;
  return Math.max(0,Math.min(100,Math.floor((viewport - top) / height * 100)));
}
