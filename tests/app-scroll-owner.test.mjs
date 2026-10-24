import test from 'node:test'
import assert from 'node:assert/strict'
import {appScrollOwner,appScrollTop,resetAppScroll} from '../lib/app-scroll-owner.mjs'
function fixture({standalone=true,mobile=true,path='/articles/story'}={}){
 const calls=[],owner={scrollTop:400,scrollTo:value=>calls.push(['content',value])}
 const win={scrollY:200,location:{pathname:path},matchMedia:()=>({matches:mobile}),scrollTo:value=>calls.push(['window',value])}
 const doc={documentElement:{classList:{contains:()=>standalone}},querySelector:()=>owner}
 return {win,doc,owner,calls}
}
test('standalone mobile reset and refresh position use content scroll owner',()=>{
 const f=fixture();assert.equal(appScrollOwner(f.win,f.doc),f.owner);assert.equal(appScrollTop(f.win,f.doc),400);resetAppScroll(f.win,f.doc);assert.deepEqual(f.calls,[['content',{top:0,left:0,behavior:'instant'}]])
})
test('browser, desktop and management retain window scrolling',()=>{
 for(const options of [{standalone:false},{mobile:false},{path:'/manage'}]){const f=fixture(options);assert.equal(appScrollOwner(f.win,f.doc),f.win);assert.equal(appScrollTop(f.win,f.doc),200);resetAppScroll(f.win,f.doc);assert.equal(f.calls[0][0],'window')}
})
