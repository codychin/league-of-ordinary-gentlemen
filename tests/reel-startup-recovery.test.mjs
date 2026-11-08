import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {monitorReelStartup} from '../lib/reel-startup-recovery.mjs';
function harness(overrides={}){
 let time=0,queued=null,manual=0,progress=0,intent=false;const calls=[];
 const video={currentTime:.0006,readyState:2,paused:false,muted:false,ended:false,pause(){calls.push('pause');this.paused=true;},load(){calls.push('load');this.currentTime=0;},play(){calls.push('play');this.paused=false;return Promise.resolve();},...overrides};
 const stop=monitorReelStartup(video,{getMuted:()=>intent,onManualRequired:()=>manual++,onProgress:()=>progress++,now:()=>time,schedule:fn=>{queued=fn;return 1;},cancel:()=>{queued=null;}});
 return {video,calls,stop,intent:value=>{intent=value;},advance(ms){time+=ms;const f=queued;queued=null;f?.();},get manual(){return manual;},get progress(){return progress;}};
}
test('unpaused readyState2 with a resolved play promise but frozen clock gets exactly one decoder reset',()=>{
 const h=harness();h.advance(4000);assert.deepEqual(h.calls,['pause','load','play']);assert.equal(h.video.muted,false);h.advance(4000);assert.equal(h.manual,1);h.advance(10000);assert.equal(h.calls.length,3);
});
test('actual clock progress ends recovery; playing events alone cannot',()=>{
 const h=harness();h.video.currentTime=.3;h.advance(4000);assert.equal(h.progress,1);assert.deepEqual(h.calls,[]);assert.equal(h.manual,0);
});
test('one decoder reset can recover without muted playback or skipping content',()=>{
 const h=harness();h.advance(4000);h.video.currentTime=.4;h.advance(250);assert.equal(h.progress,1);assert.equal(h.manual,0);assert.equal(h.video.muted,false);h.advance(10000);assert.equal(h.calls.length,3);
});
test('recovery honors current user mute intent, not stale initial state',()=>{const h=harness();h.intent(true);h.advance(4000);assert.equal(h.video.muted,true);});
test('slow data arrival is not repeatedly reloaded; unavailable data gets visible fallback',()=>{const h=harness({readyState:0});h.advance(4000);assert.equal(h.calls.length,0);h.advance(4000);assert.equal(h.manual,1);assert.equal(h.calls.length,0);});
test('rejected restart requests manual user gesture and stops automatic retry',async()=>{const h=harness({play(){this.paused=true;return Promise.reject(Error('NotAllowedError'));}});h.advance(4000);await Promise.resolve();assert.equal(h.manual,1);h.advance(8000);assert.equal(h.manual,1);});
test('unmount cancels timer and ignores late playback rejection',async()=>{let reject;const h=harness({play(){return new Promise((_,r)=>{reject=r;});}});h.advance(4000);h.stop();reject(Error('closed'));await Promise.resolve();assert.equal(h.manual,0);});
test('reel UI exposes manual fallback and no longer silently mutes failed unmuted start',()=>{const s=fs.readFileSync('app/components/ReelsShelf.jsx','utf8');assert.match(s,/aria-label="Play video"/);assert.match(s,/monitorReelStartup/);assert.doesNotMatch(s,/video\.muted=true;setMuted\(true\)/);assert.doesNotMatch(s,/onPlaying=\{.*setHasStarted\(true\)/);});
