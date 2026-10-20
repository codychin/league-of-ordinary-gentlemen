import {JSDOM} from 'jsdom';
import test from 'node:test';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
test('actual React analytics lifecycle: opt-in, streamed SPA pages, privacy and media',async()=>{
const bundle=await build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import EngagementAnalytics from './app/components/EngagementAnalytics.jsx'; createRoot(document.getElementById('root')).render(<React.StrictMode><EngagementAnalytics/></React.StrictMode>);`,resolveDir:process.cwd(),loader:'jsx'},write:false,bundle:true,format:'iife',jsx:'automatic',plugins:[{name:'test-navigation',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:`import {useEffect,useState} from 'react';export function usePathname(){const [p,setP]=useState(location.pathname);useEffect(()=>{const f=()=>setP(location.pathname);window.addEventListener('route',f);return()=>window.removeEventListener('route',f)},[]);return p}`,resolveDir:process.cwd()}))}}],define:{'process.env.NEXT_PUBLIC_BRIEF_ANALYTICS_ENABLED':'"true"','process.env.NEXT_PUBLIC_VERCEL_ENV':'"production"','process.env.NEXT_PUBLIC_POSTHOG_KEY':'"phc_testonly"','process.env.NEXT_PUBLIC_POSTHOG_HOST':'"https://us.i.posthog.com"'}});
const dom=new JSDOM('<!doctype html><html><body><div id="fixture"></div><div id="root"></div></body></html>',{url:'https://www.ordinarybrief.com/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window, requests=[];let now=0,visible=true,focused=true;
Object.defineProperty(w.performance,'now',{value:()=>now});
Object.defineProperty(w.document,'visibilityState',{get:()=>visible?'visible':'hidden'});
w.document.hasFocus=()=>focused;
w.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true}};
w.eval(bundle.outputFiles[0].text);
try {
const wait=()=>new Promise(r=>setTimeout(r,150));
const route=async(path)=>{w.history.pushState({},'',path);w.dispatchEvent(new w.Event('route'));await wait()};
const click=async(text)=>{const b=[...w.document.querySelectorAll('button')].find(x=>x.textContent===text);assert.ok(b,text);b.click();await wait()};
await wait();assert.equal(requests.length,0);
await click('Allow optional analytics');assert.equal(requests.filter(x=>x.event==='page_view').length,1);
await route('/articles/hollis-test?email=private');assert.equal(requests.filter(x=>x.event==='article_view').length,0);
w.document.getElementById('fixture').innerHTML='<main data-analytics-path="/articles/hollis-test" data-analytics-article="article_opaque" data-analytics-writer="hollis-crane"><article data-analytics-body>Test</article></main>';
w.document.querySelector('[data-analytics-body]').getBoundingClientRect=()=>({top:0,bottom:2000,height:2000});await wait();
assert.equal(requests.filter(x=>x.event==='article_view').length,1);
// Hidden time cannot become active reading time on restoration.
visible=false;focused=false;w.document.dispatchEvent(new w.Event('visibilitychange'));
now=2000;visible=true;focused=true;w.document.dispatchEvent(new w.Event('visibilitychange'));await wait();
assert.equal(requests.filter(x=>x.event==='article_read_time').length,0);
now=7000;w.dispatchEvent(new w.Event('pointerdown'));visible=false;w.document.dispatchEvent(new w.Event('visibilitychange'));await wait();
assert.equal(requests.filter(x=>x.event==='article_read_time').at(-1).properties.active_seconds,5);
visible=true;w.document.dispatchEvent(new w.Event('visibilitychange'));
await route('/articles/hollis-test?different=secret#heading');assert.equal(requests.filter(x=>x.event==='article_view').length,1);
w.document.querySelector('[data-analytics-body]').getBoundingClientRect=()=>({top:-1000,bottom:1000,height:2000});w.dispatchEvent(new w.Event('scroll'));w.dispatchEvent(new w.Event('scroll'));await wait();
assert.equal(requests.filter(x=>x.event==='article_scroll'&&x.properties.scroll_percent===75).length,1);
w.document.getElementById('fixture').insertAdjacentHTML('beforeend','<video id="active" data-analytics-reel="test-reel" data-analytics-writer="Sabine March" data-analytics-placement="also"></video><video id="preload"></video>');
w.document.getElementById('preload').dispatchEvent(new w.Event('playing'));
const v=w.document.getElementById('active');v.dispatchEvent(new w.Event('playing'));v.dispatchEvent(new w.Event('playing'));v.dispatchEvent(new w.Event('ended'));v.dispatchEvent(new w.Event('ended'));await wait();
assert.equal(requests.filter(x=>x.event==='reel_start').length,1);assert.equal(requests.filter(x=>x.event==='reel_complete').length,1);
await click('Decline / withdraw');const n=requests.length;w.dispatchEvent(new w.Event('scroll'));await wait();assert.equal(requests.length,n);assert.equal(w.localStorage.getItem('brief-analytics-browser-v1'),null);
await route('/');await click('Allow optional analytics');await route('/articles/hollis-test');assert.equal(requests.filter(x=>x.event==='article_view').length,2,'return through another route counts');
const beforeRestore=requests.filter(x=>x.event==='article_view').length;
w.dispatchEvent(new w.PageTransitionEvent('pageshow',{persisted:true}));await wait();assert.equal(requests.filter(x=>x.event==='article_view').length,beforeRestore+1,'BFCache restore is a new visit');
w.localStorage.setItem('brief-analytics-consent-v1','denied');w.localStorage.removeItem('brief-analytics-browser-v1');w.dispatchEvent(new w.StorageEvent('storage',{key:'brief-analytics-consent-v1',newValue:'denied'}));await wait();
const beforeRegrant=requests.length;w.dispatchEvent(new w.Event('scroll'));await wait();assert.equal(requests.length,beforeRegrant);
w.localStorage.setItem('brief-analytics-consent-v1','granted');w.dispatchEvent(new w.StorageEvent('storage',{key:'brief-analytics-consent-v1',newValue:'granted'}));await wait();assert.equal(requests.at(-1).event,'article_view','cross-tab regrant starts with view');
await route('/manage');assert.equal(w.localStorage.getItem('brief-analytics-internal-v1'),'1');const after=requests.length;await route('/');assert.equal(requests.length,after);
assert.ok(!JSON.stringify(requests).includes('private'));assert.ok(!JSON.stringify(requests).includes('secret'));
} finally {dom.window.close()}
});
