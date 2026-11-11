import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDocumentScrollSample} from '../qa/helpers/document-scroll-contract.mjs';
const sample=()=>({owner:'HTML',legacyWrapper:false,position:'fixed',bodyOverflow:'visible',rootOverflow:'visible',scrollY:400,innerHeight:844,innerWidth:390,viewport:{height:844,offsetTop:0,scale:1},rect:{top:787,bottom:841,left:12,right:378,height:54},content:{scrollTop:400,scrollHeight:3000,clientHeight:844,scrollWidth:390,clientWidth:390},bottom:3});
test('current document owner and fixed viewport navigation remain valid after scrolling',()=>assert.doesNotThrow(()=>assertDocumentScrollSample(sample())));
for(const [name,mutate] of [
 ['absolute navigation',s=>s.position='absolute'],['legacy nested scroller',s=>s.legacyWrapper=true],['body scroll owner',s=>s.owner='BODY'],['offscreen navigation',s=>s.rect.bottom+=100],['detached bottom inset',s=>{s.rect.top-=20;s.rect.bottom-=20;}],['horizontal overflow',s=>s.content.scrollWidth+=50],['stuck root position',s=>s.content.scrollTop=0],['out of bounds scroll',s=>s.scrollY=s.content.scrollTop=100000],['body still locked',s=>s.bodyOverflow='hidden'],['root still locked',s=>s.rootOverflow='hidden']
])test('document navigation rejects '+name,()=>{const s=sample();mutate(s);assert.throws(()=>assertDocumentScrollSample(s));});
