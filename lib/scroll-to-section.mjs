// Keep an anchor aligned while late images, embeds and hydrated sections settle.
// User input always wins: never pull someone back after they start reading.
export function scrollToSection(id, win=window, doc=document){
  let stopped=false, frame=0
  const align=()=>{
    if(stopped)return
    const target=doc.getElementById(id)
    if(!target)return
    const padding=parseFloat(win.getComputedStyle(doc.documentElement).scrollPaddingTop)||0
    const margin=parseFloat(win.getComputedStyle(target).scrollMarginTop)||0
    if(Math.abs(target.getBoundingClientRect().top-padding-margin)>1){
      target.scrollIntoView({behavior:'instant',block:'start'})
    }
  }
  const schedule=()=>{
    if(stopped||frame)return
    frame=win.requestAnimationFrame(()=>{frame=0;align()})
  }
  const resize=new win.ResizeObserver(schedule)
  const watch=()=>{
    resize.observe(doc.body)
    const target=doc.getElementById(id)
    const main=target?.closest('main')||doc.querySelector('main')
    if(main){
      resize.observe(main)
      // Observe each section: two height changes can cancel out at body level.
      for(const child of main.children)resize.observe(child)
    }
    schedule()
  }
  const mutations=new win.MutationObserver(watch)
  const events=['touchstart','pointerdown','wheel','keydown']
  const cancel=()=>{
    if(stopped)return
    stopped=true
    resize.disconnect()
    mutations.disconnect()
    win.cancelAnimationFrame(frame)
    win.clearTimeout(timer)
    for(const event of events)win.removeEventListener(event,cancel,true)
    doc.removeEventListener('load',schedule,true)
  }
  const timer=win.setTimeout(cancel,5000)
  for(const event of events)win.addEventListener(event,cancel,{capture:true,passive:true})
  doc.addEventListener('load',schedule,true)
  mutations.observe(doc.body,{childList:true,subtree:true})
  watch()
  align()
  return cancel
}
