'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

// Keep small direction reversals and elastic overscroll from toggling the bar.
export default function useCompactMobileNav(pathname, expanded) {
  const [compact,setCompact]=useState(false)
  const resetRef=useRef(()=>{})
  const expand=useCallback(()=>resetRef.current(),[])

  useEffect(()=>{
    const mobile=window.matchMedia('(max-width: 760px)')
    const scrollY=()=>Math.max(0,Math.min(window.scrollY,Math.max(0,document.documentElement.scrollHeight-window.innerHeight)))
    const editing=()=>document.activeElement?.matches('input,textarea,select,[contenteditable]:not([contenteditable="false"])')||document.activeElement?.isContentEditable
    let previous=scrollY(),anchor=previous,direction=0,frame=0,isCompact=false,navigationPending=false
    const set=value=>{if(value!==isCompact){isCompact=value;setCompact(value)}}
    const reset=()=>{previous=scrollY();anchor=previous;direction=0;set(false)}
    // A route/menu change always starts at the original size.
    setCompact(false)
    // Anchor scrolling is navigation, not a request to compact the controls.
    resetRef.current=()=>{navigationPending=true;reset()}
    const onIntent=event=>{
      if(event.type==='keydown'&&!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))return
      // Compositor scrolling can precede a passive input callback. Keep the
      // last observed position so the first real gesture is not discarded.
      if(navigationPending){navigationPending=false;direction=0;anchor=previous}
    }
    const update=()=>{
      frame=0
      const y=scrollY()
      if(!mobile.matches||expanded||editing()||navigationPending){reset();return}
      if(y<=64){reset();return}
      const delta=y-previous
      if(Math.abs(delta)<2)return
      const nextDirection=Math.sign(delta)
      if(nextDirection!==direction){direction=nextDirection;anchor=previous}
      previous=y
      if(direction>0&&y>=160&&y-anchor>=56)set(true)
      else if(direction<0&&anchor-y>=32)set(false)
    }
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update)}
    window.addEventListener('scroll',onScroll,{passive:true})
    window.addEventListener('wheel',onIntent,{passive:true})
    window.addEventListener('touchmove',onIntent,{passive:true})
    window.addEventListener('keydown',onIntent)
    document.addEventListener('focusin',reset)
    document.addEventListener('focusout',reset)
    mobile.addEventListener('change',reset)
    return()=>{
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll',onScroll)
      window.removeEventListener('wheel',onIntent)
      window.removeEventListener('touchmove',onIntent)
      window.removeEventListener('keydown',onIntent)
      document.removeEventListener('focusin',reset)
      document.removeEventListener('focusout',reset)
      mobile.removeEventListener('change',reset)
      resetRef.current=()=>{}
    }
  },[pathname,expanded])

  return [compact&&!expanded,expand]
}
