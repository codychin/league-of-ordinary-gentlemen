import assert from 'node:assert/strict';
// This callback runs in the browser against the real navigation element.
export function documentScrollSample(el){
 const r=el.getBoundingClientRect(),v=visualViewport,c=document.scrollingElement,style=getComputedStyle(el);
 return {path:location.pathname,scrollY,innerHeight,innerWidth,owner:c?.tagName,legacyWrapper:!!document.querySelector('.appScrollContent'),bodyOverflow:getComputedStyle(document.body).overflowY,rootOverflow:getComputedStyle(document.documentElement).overflowY,viewport:v?{height:v.height,offsetTop:v.offsetTop,scale:v.scale}:null,rect:{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height},content:{scrollTop:c.scrollTop,scrollHeight:c.scrollHeight,clientHeight:c.clientHeight,scrollWidth:c.scrollWidth,clientWidth:c.clientWidth},bottom:parseFloat(style.bottom),position:style.position};
}
export function assertDocumentScrollSample(s){
 const detail=JSON.stringify(s);
 assert.equal(s.owner,'HTML',detail);assert.equal(s.legacyWrapper,false,detail);
 assert.equal(s.position,'fixed',detail);
 assert.ok(!['hidden','clip'].includes(s.bodyOverflow)&&!['hidden','clip'].includes(s.rootOverflow),detail);
 assert.ok(s.content.clientHeight>0&&s.rect.height>0,detail);
 assert.ok(Math.abs(s.scrollY-s.content.scrollTop)<=1,detail);
 assert.ok(s.scrollY>=-1&&s.scrollY<=Math.max(0,s.content.scrollHeight-s.content.clientHeight)+1,detail);
 assert.ok(s.content.scrollWidth<=s.content.clientWidth+1,detail);
 const top=s.viewport?.offsetTop||0,bottom=top+(s.viewport?.height||s.innerHeight);
 assert.ok(s.rect.top>=top-1&&s.rect.bottom<=bottom+1&&s.rect.left>=-1&&s.rect.right<=s.innerWidth+1,detail);
 assert.ok(Number.isFinite(s.bottom)&&Math.abs(bottom-s.rect.bottom-s.bottom)<2,detail);
}
