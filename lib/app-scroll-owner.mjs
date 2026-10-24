// Standalone mobile owns content scrolling; normal browsers retain document scrolling.
export function appScrollOwner(win=window,doc=document){
  return doc.documentElement.classList.contains('standaloneApp') && win.matchMedia('(max-width: 760px)').matches && !win.location.pathname.startsWith('/manage')
    ? doc.querySelector('.appScrollContent') || win : win
}
export function appScrollTop(win=window,doc=document){const owner=appScrollOwner(win,doc);return owner===win?win.scrollY:owner.scrollTop}
export function resetAppScroll(win=window,doc=document){appScrollOwner(win,doc).scrollTo({top:0,left:0,behavior:'instant'})}

// Capture once per viewer session so closing a reel restores the same reading position.
export function lockReelScroll(win=window,doc=document){
 const owner=appScrollOwner(win,doc),root=doc.documentElement,body=doc.body
 const left=owner===win?win.scrollX:owner.scrollLeft,top=appScrollTop(win,doc)
 const targets=[...new Set([root,body,...(owner===win?[]:[owner])])]
 const overflow=targets.map(el=>el.style.overflow),hadReelsOpen=body.classList.contains('reelsOpen')
 targets.forEach(el=>{el.style.overflow='hidden'})
 body.classList.add('reelsOpen')
 return()=>{
  targets.forEach((el,i)=>{el.style.overflow=overflow[i]})
  if(!hadReelsOpen)body.classList.remove('reelsOpen')
  owner.scrollTo({left,top,behavior:'instant'})
 }
}
