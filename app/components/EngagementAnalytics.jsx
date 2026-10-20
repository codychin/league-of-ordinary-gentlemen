'use client';

import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {CONSENT_KEY,INTERNAL_KEY,VISITOR_KEY,routeContext,eligible,createTransport,activeDelta,scrollPercent} from '../../lib/engagement-analytics.mjs';

const config = {
  enabled:process.env.NEXT_PUBLIC_BRIEF_ANALYTICS_ENABLED,
  environment:process.env.NEXT_PUBLIC_VERCEL_ENV,
  token:process.env.NEXT_PUBLIC_POSTHOG_KEY,
  host:process.env.NEXT_PUBLIC_POSTHOG_HOST,
};
let currentVisit;
function visitFor(path) {
  if (!currentVisit || currentVisit.path !== path) currentVisit = {path,id:crypto.randomUUID(),viewed:false,scroll:new Set()};
  return currentVisit;
}

export default function EngagementAnalytics() {
  const pathname = usePathname();
  const [choice,setChoice] = useState(null);
  const [internal,setInternal] = useState(false);
  const [available,setAvailable] = useState(false);
  const [snapshot,setSnapshot] = useState(null);
  const [resumeEpoch,setResumeEpoch] = useState(0);
  useEffect(()=>{
    const storage = event => {
      if (![CONSENT_KEY,INTERNAL_KEY,null].includes(event.key)) return;
      currentVisit=undefined;
      try {setChoice(localStorage.getItem(CONSENT_KEY));setInternal(localStorage.getItem(INTERNAL_KEY)==='1');setResumeEpoch(n=>n+1)} catch {setAvailable(false)}
    };
    const restore = event => {if(event.persisted){currentVisit=undefined;setResumeEpoch(n=>n+1)}};
    window.addEventListener('storage',storage);window.addEventListener('pageshow',restore);
    return()=>{window.removeEventListener('storage',storage);window.removeEventListener('pageshow',restore)};
  },[]);
  useEffect(()=>{
    const find = () => {
      const path = pathname.replace(/\/$/,'') || '/';
      const article = [...document.querySelectorAll('[data-analytics-article][data-analytics-path]')].find(node=>node.dataset.analyticsPath===path);
      if (path.includes('/articles/') && !article) return false;
      setSnapshot({pathname,article,context:routeContext(pathname,{id:article?.dataset.analyticsArticle,writer:article?.dataset.analyticsWriter})});
      return true;
    };
    if (find()) return;
    // Dynamic/streamed articles may arrive after the persistent root layout.
    const observer = new MutationObserver(()=>{if(find())observer.disconnect()});
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[pathname]);
  useEffect(()=>{
    try {
      // A management visit marks this browser internal before any capture can run.
      if (/^\/manage(\/|$)/.test(pathname)) localStorage.setItem(INTERNAL_KEY,'1');
      setInternal(localStorage.getItem(INTERNAL_KEY)==='1');
      setChoice(localStorage.getItem(CONSENT_KEY));
      setAvailable(config.enabled==='true' && config.environment==='production' && ['ordinarybrief.com','www.ordinarybrief.com'].includes(location.hostname));
    } catch {setAvailable(false)}
  },[pathname]);

  useEffect(()=>{
    let stopped = false;
    const allowed = () => {
      try {return !stopped && eligible({...config,hostname:location.hostname,consent:localStorage.getItem(CONSENT_KEY),internal:localStorage.getItem(INTERNAL_KEY)==='1',dnt:navigator.doNotTrack,gpc:navigator.globalPrivacyControl,webdriver:navigator.webdriver,search:location.search});} catch {return false}
    };
    const visit = visitFor(pathname);
    if (!allowed()) return;
    if (snapshot?.pathname!==pathname) return;
    const {article,context} = snapshot;
    if (!context) return;
    const send = createTransport({token:config.token,host:config.host,allowed,storage:localStorage,randomUUID:()=>crypto.randomUUID(),fetcher:window.fetch.bind(window)});
    const emit = (name,extra={}) => send(name,context,{visit_id:visit.id,...extra});
    let last = performance.now(), lastActivity = last, accumulated = 0;
    const body = article?.querySelector('[data-analytics-body]');
    const view = () => {
      if (document.visibilityState==='visible' && !visit.viewed) {
        visit.viewed = emit(context.page_type==='article'?'article_view':'page_view');
      }
    };
    const flush = () => {
      const seconds = Math.floor(accumulated / 1000);
      if (seconds > 0) {emit('article_read_time',{active_seconds:seconds}); accumulated -= seconds * 1000;}
    };
    const isInView = () => {const rect=body?.getBoundingClientRect();return Boolean(rect && rect.top<innerHeight && rect.bottom>0)};
    let wasVisible=document.visibilityState==='visible', wasFocused=document.hasFocus(), wasInArticle=isInView();
    const sample = () => {
      const now = performance.now();
      const activeWindow = Math.max(0,30000-(last-lastActivity));
      if (body) accumulated += activeDelta({elapsed:Math.min(now-last,activeWindow),visible:wasVisible,focused:wasFocused,idle:last-lastActivity,inArticle:wasInArticle});
      last = now;
      wasVisible=document.visibilityState==='visible';wasFocused=document.hasFocus();wasInArticle=isInView();
      if (accumulated >= 15000) flush();
    };
    const activity = () => {sample();lastActivity=performance.now()};
    const scroll = () => {
      activity();
      if (!body || document.visibilityState!=='visible' || !document.hasFocus()) return;
      const rect = body.getBoundingClientRect();
      const percent = scrollPercent({top:rect.top,height:rect.height,viewport:innerHeight});
      for (const mark of [25,50,75,100]) if (percent>=mark && !visit.scroll.has(mark)) {
        if (emit('article_scroll',{scroll_percent:mark})) visit.scroll.add(mark);
      }
    };
    const visibility = () => {sample();flush();last=performance.now();view()};
    const pagehide = () => {sample();flush();wasVisible=false;wasFocused=false};
    const click = event => {
      const link = event.target.closest?.('[data-analytics-carousel]');
      if (!link) return;
      emit('carousel_click',{article_id:link.dataset.analyticsArticle,reel_id:link.dataset.analyticsReel,correspondent:link.dataset.analyticsWriter,placement:link.dataset.analyticsCarousel});
    };
    const started = new WeakSet(), completed = new WeakSet();
    const playing = event => {
      const video=event.target;
      if (!video.matches?.('video[data-analytics-reel]') || started.has(video) || document.visibilityState!=='visible') return;
      if (emit('reel_start',{reel_id:video.dataset.analyticsReel,article_id:video.dataset.analyticsArticle,correspondent:video.dataset.analyticsWriter,placement:video.dataset.analyticsPlacement})) started.add(video);
    };
    const ended = event => {
      const video=event.target;
      if (!started.has(video) || completed.has(video)) return;
      if (emit('reel_complete',{reel_id:video.dataset.analyticsReel,article_id:video.dataset.analyticsArticle,correspondent:video.dataset.analyticsWriter,placement:video.dataset.analyticsPlacement})) completed.add(video);
    };
    view();
    const timer=setInterval(sample,5000);
    for (const name of ['pointerdown','keydown','touchstart']) window.addEventListener(name,activity,{passive:true});
    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('pagehide',pagehide);
    window.addEventListener('blur',pagehide);
    window.addEventListener('focus',visibility);
    document.addEventListener('visibilitychange',visibility);
    document.addEventListener('click',click,true);
    document.addEventListener('playing',playing,true);
    document.addEventListener('ended',ended,true);
    return()=>{
      sample();flush();stopped=true;clearInterval(timer);
      for (const name of ['pointerdown','keydown','touchstart']) window.removeEventListener(name,activity);
      window.removeEventListener('scroll',scroll);window.removeEventListener('pagehide',pagehide);window.removeEventListener('blur',pagehide);window.removeEventListener('focus',visibility);
      document.removeEventListener('visibilitychange',visibility);document.removeEventListener('click',click,true);document.removeEventListener('playing',playing,true);document.removeEventListener('ended',ended,true);
    };
  },[pathname,choice,internal,snapshot,resumeEpoch]);

  const choose = value => {
    try {
      localStorage.setItem(CONSENT_KEY,value);
      if (value!=='granted') {localStorage.removeItem(VISITOR_KEY);currentVisit=undefined;}
      setChoice(value);
    } catch {setAvailable(false)}
  };
  const exclude = () => {
    try {localStorage.setItem(INTERNAL_KEY,'1');localStorage.removeItem(VISITOR_KEY);setInternal(true);setChoice('denied');localStorage.setItem(CONSENT_KEY,'denied')} catch {}
  };
  // Small inline controls, never an overlay blocking the edition or PWA navigation.
  if (!available || /^\/manage(\/|$)/.test(pathname)) return null;
  return <aside aria-label="Analytics privacy" style={{padding:'14px 22px 100px',fontSize:12,lineHeight:1.6,maxWidth:760,margin:'0 auto'}}>
    <details><summary>Analytics preferences{internal?' · this browser excluded':''}</summary>
      <p>Optional PostHog analytics help us understand which pages and stories people use. If you allow it, we store a random browser ID and send page categories, article/video IDs, clicks, scroll milestones and foreground reading-time estimates to PostHog. No names, emails, league-member details, article text, session recordings or advertising tracking are included. PostHog receives your network IP; location enrichment is disabled. Returning-reader counts describe browsers, not identified people. Browser privacy signals are respected. You can withdraw here at any time.</p>
      {!internal && <><button type="button" onClick={()=>choose('granted')}>Allow optional analytics</button>{' '}<button type="button" onClick={()=>choose('denied')}>Decline / withdraw</button>{' '}<button type="button" onClick={exclude}>Exclude my staff/test browser</button><p>{choice==='granted'?'Allowed on this browser, subject to browser privacy settings.':'Off on this browser.'}</p></>}
    </details>
  </aside>;
}
