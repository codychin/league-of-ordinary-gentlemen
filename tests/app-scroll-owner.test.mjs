import test from 'node:test';
import assert from 'node:assert/strict';
import {appScrollOwner,appScrollTop,resetAppScroll} from '../lib/app-scroll-owner.mjs';
for(const [standalone,mobile,path,bounded] of [[true,true,'/',true],[true,true,'/articles/test',true],[true,true,'/manage',false],[true,false,'/',false],[false,true,'/',false]]){
 test(`scroll owner standalone=${standalone} mobile=${mobile} path=${path}`,()=>{
  let reset;
  const owner={scrollTop:240,scrollTo:value=>reset=value};
  const win={scrollY:120,matchMedia:()=>({matches:mobile}),location:{pathname:path},scrollTo:value=>reset=value};
  const doc={documentElement:{classList:{contains:()=>standalone}},querySelector:()=>owner};
  assert.equal(appScrollOwner(win,doc),bounded?owner:win);
  assert.equal(appScrollTop(win,doc),bounded?240:120);
  resetAppScroll(win,doc);assert.deepEqual(reset,{top:0,left:0,behavior:'instant'});
 });
}
