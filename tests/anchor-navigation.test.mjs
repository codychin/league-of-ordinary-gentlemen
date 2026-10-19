import test from 'node:test'
import assert from 'node:assert/strict'
import {scrollToSection} from '../lib/scroll-to-section.mjs'
function fixture({present=true}={}){
 let top=2400,scrolls=0,resize,mutation,timeout
 const events=new Map(),frames=new Map()
 const target={getBoundingClientRect:()=>({top}),scrollIntoView:()=>{top=42;scrolls++},closest:()=>main},main={children:[{},target]}
 const doc={body:{},documentElement:{},getElementById:()=>present?target:null,querySelector:()=>main,addEventListener(){},removeEventListener(){}}
 const win={getComputedStyle:el=>el===doc.documentElement?{scrollPaddingTop:'42px'}:{scrollMarginTop:'0px'},ResizeObserver:class{constructor(cb){resize=cb}observe(){}disconnect(){resize=null}},MutationObserver:class{constructor(cb){mutation=cb}observe(){}disconnect(){mutation=null}},requestAnimationFrame:cb=>{frames.set(1,cb);return 1},cancelAnimationFrame:id=>frames.delete(id),setTimeout:cb=>{timeout=cb;return 1},clearTimeout(){},addEventListener:(name,cb)=>events.set(name,cb),removeEventListener:name=>events.delete(name)}
 return {win,doc,get scrolls(){return scrolls},get top(){return top},flush(){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb())},shift(value){top=value;resize?.()},appear(){present=true;mutation?.()},input(name){events.get(name)?.()},expire(){timeout()},get active(){return !!resize}}
}
test('Culture stays aligned after earlier content expands, without redundant scrolling',()=>{
 const f=fixture();scrollToSection('culture',f.win,f.doc);f.flush();assert.equal(f.scrolls,1);f.shift(800);f.flush();assert.equal(f.top,42);assert.equal(f.scrolls,2)
})
test('user input cancels correction immediately',()=>{
 for(const event of ['touchstart','wheel','pointerdown','keydown']){const f=fixture();scrollToSection('culture',f.win,f.doc);f.input(event);f.shift(800);f.flush();assert.equal(f.scrolls,1);assert.equal(f.top,800);assert.equal(f.active,false)}
})
test('waits for a cross-page target and stops at deadline',()=>{
 const f=fixture({present:false});scrollToSection('culture',f.win,f.doc);f.flush();assert.equal(f.scrolls,0);f.appear();f.flush();assert.equal(f.scrolls,1);f.expire();assert.equal(f.active,false)
})
test('subsequent navigation cancels pending correction',()=>{
 const f=fixture();const cancel=scrollToSection('culture',f.win,f.doc);cancel();f.flush();assert.equal(f.active,false)
})
