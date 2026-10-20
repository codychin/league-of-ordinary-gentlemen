import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eligible,routeContext,makeEvent,createTransport,activeDelta,scrollPercent,writerId,VISITOR_KEY} from '../lib/engagement-analytics.mjs';
const good={enabled:'true',environment:'production',hostname:'www.ordinarybrief.com',consent:'granted',internal:false,dnt:'0',gpc:false,webdriver:false};
test('tracking is opt-in, production-only and respects privacy/internal/test signals',()=>{
 assert.equal(eligible(good),true);
 for(const patch of [{enabled:'false'},{environment:'preview'},{environment:undefined},{hostname:'fake.ordinarybrief.com'},{consent:null},{consent:'denied'},{internal:true},{dnt:'1'},{gpc:true},{webdriver:true},{search:'?app-preview=1'},{search:'?analytics-test=1'},{search:'?preview=true'}]) assert.equal(eligible({...good,...patch}),false,JSON.stringify(patch));
});
test('routes retain edition isolation without transmitting team names or URL parameters',()=>{
 assert.deepEqual(routeContext('/sunday-crew/teams/private-person?email=secret#private'),{league:'sunday-crew',page_type:'teams'});
 assert.deepEqual(routeContext('/doge'),{league:'doge',page_type:'home'});
 assert.equal(routeContext('/manage'),null);
 assert.equal(routeContext('/api/oauth'),null);
 assert.equal(routeContext('/doge/articles/member-name'),null);
 assert.deepEqual(routeContext('/doge/articles/member-name',{id:'3f72-abc',writer:'march'}),{league:'doge',page_type:'article',article_id:'3f72-abc',correspondent:'sabine-march'});
 assert.equal(routeContext('/unknown'),null);
});
test('event allowlist drops text, URLs, identity and arbitrary values',()=>{
 const event=makeEvent('reel_start',{league:'loog',page_type:'home',email:'SECRET'},{reel_id:'abcdef',title:'SECRET',src:'https://private',correspondent:'Marnie Kells',placement:'also',member_name:'SECRET',visit_id:'123-abc'});
 assert.equal(event.properties.correspondent,'marnie-kells');
 assert.ok(!JSON.stringify(event).includes('SECRET'));
 assert.equal(event.properties.$process_person_profile,false);
 assert.equal(event.properties.$geoip_disable,true);
 assert.equal(makeEvent('$identify',{}),null);
 assert.ok(!makeEvent('article_view',{}, {article_id:'https://secret?a=b'}).properties.article_id);
});
test('writer tags normalize only known staff, never member names',()=>{
 assert.equal(writerId('Hollis Crane'),'hollis-crane'); assert.equal(writerId('pike'),'dashiell-pike');assert.equal(writerId('private person'),'newsroom');
});
test('read-time is foreground, focused, in-view and recently active only',()=>{
 const sample={elapsed:5000,visible:true,focused:true,inArticle:true,idle:5000};
 assert.equal(activeDelta(sample),5000);
 for(const patch of [{visible:false},{focused:false},{inArticle:false},{idle:30001}]) assert.equal(activeDelta({...sample,...patch}),0);
 assert.equal(activeDelta({...sample,elapsed:300000}),5000);
 assert.equal(activeDelta({...sample,elapsed:-1}),0);
});
test('scroll uses article-body geometry rather than total page or comments',()=>{
 assert.equal(scrollPercent({top:0,height:2000,viewport:500}),25);
 assert.equal(scrollPercent({top:-1500,height:2000,viewport:500}),100);
 assert.equal(scrollPercent({top:600,height:2000,viewport:500}),0);
 assert.equal(scrollPercent({top:-2500,height:2000,viewport:500}),0);
});
test('transport is no-referrer, credentialless, bounded and consent checked on every event',async()=>{
 const data=new Map(), calls=[];let permitted=true;
 const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 const send=createTransport({token:'phc_testonly',host:'https://us.i.posthog.com',allowed:()=>permitted,storage,randomUUID:()=> '00000000-0000-4000-8000-000000000000',fetcher:async(...args)=>calls.push(args)});
 assert.equal(send('page_view',{league:'loog',page_type:'home'}),true);
 assert.equal(data.size,1);assert.ok(data.has(VISITOR_KEY));
 const [url,opts]=calls[0];assert.equal(url,'https://us.i.posthog.com/i/v0/e/');assert.equal(opts.referrerPolicy,'no-referrer');assert.equal(opts.credentials,'omit');
 const body=JSON.parse(opts.body);assert.equal(body.distinct_id,data.get(VISITOR_KEY));assert.equal(body.api_key,'phc_testonly');
 permitted=false;assert.equal(send('page_view',{}),false);assert.equal(calls.length,1);
});
test('invalid host/token and unavailable storage fail closed with no network',()=>{
 for(const patch of [{token:''},{token:'personal_secret'},{host:'https://attacker.invalid'},{storage:{getItem(){throw Error('blocked')}}}]) {
 let calls=0;const send=createTransport({token:'phc_testonly',host:'https://eu.i.posthog.com',allowed:()=>true,storage:{getItem:()=>null,setItem:()=>{}},randomUUID:()=> '00000000-0000-4000-8000-000000000000',fetcher:async()=>calls++,...patch});
 assert.equal(send('page_view',{}),false);assert.equal(calls,0);
 }
});
test('integration uses pathname lifecycle, deliberate markers and no preloader tracking',()=>{
 const component=readFileSync('app/components/EngagementAnalytics.jsx','utf8');
 assert.match(component,/\[pathname,choice,internal,snapshot,resumeEpoch\]/);assert.match(component,/currentVisit.path !== path/);assert.match(component,/!visit.viewed/);
 assert.match(component,/localStorage.removeItem\(VISITOR_KEY\)/);assert.match(component,/navigator.globalPrivacyControl/);
 for(const path of ['app/components/ReelsShelf.jsx','app/components/AlsoShelf.jsx']) assert.match(readFileSync(path,'utf8'),/data-analytics-reel=/);
 const reels=readFileSync('app/components/ReelsShelf.jsx','utf8');assert.doesNotMatch(reels,/<video[^>]*data-analytics-reel[^>]*ref=\{preloadRef\}/);
 assert.match(readFileSync('app/articles/[slug]/page.js','utf8'),/data-analytics-body/);
 assert.match(readFileSync('app/components/editions/Article.js','utf8'),/data-analytics-article=\{article.id\}/);
});
