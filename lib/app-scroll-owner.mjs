// Installed mobile content scrolls independently from the navigation row.
// Browser tabs and management pages keep their native document scroll owner.
export function appScrollOwner(win=window,doc=document){
  return doc.documentElement.classList.contains('standaloneApp') && win.matchMedia('(max-width: 760px)').matches && !win.location.pathname.startsWith('/manage')
    ? doc.querySelector('.appScrollContent') || win : win
}
export function appScrollTop(win=window,doc=document){const owner=appScrollOwner(win,doc);return owner===win?win.scrollY:owner.scrollTop}
export function resetAppScroll(win=window,doc=document){appScrollOwner(win,doc).scrollTo({top:0,left:0,behavior:'instant'})}
