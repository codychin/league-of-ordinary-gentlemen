'use client'
import {useEffect} from 'react'
import {usePathname} from 'next/navigation'

// Small, sequential image warmup only. Never prefetch video, API data, or whole pages.
export default function ImageWarmup(){
 const pathname=usePathname()
 useEffect(()=>{
  if(pathname.startsWith('/manage'))return
  const connection=navigator.connection
  if(connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType))return
  let cancelled=false,timer,running=false;const seen=new Set();const pending=new Set()
  const warm=async()=>{
   if(running||cancelled)return
   running=true
   const images=[...document.querySelectorAll('img[data-brief-image]')]
   // Promote first-screen images on the selected tab, even if they were previously hidden.
   images.filter(img=>{const r=img.getBoundingClientRect();return r.width>0&&r.top<innerHeight&&r.bottom>0}).slice(0,4).forEach(img=>{img.loading='eager'})
   const eligible=img=>(!img.complete||!img.naturalWidth)&&!seen.has(img.src)
   const culture=images.filter(img=>img.closest('#culture')&&eligible(img)).slice(0,3)
   const candidates=[...culture,...images.filter(img=>!culture.includes(img)&&eligible(img)).slice(0,3)]
   for(const img of candidates){
    if(cancelled)break
    seen.add(img.src)
    await new Promise(resolve=>{
     const preview=new Image();pending.add(preview);const done=()=>{clearTimeout(timeout);pending.delete(preview);resolve()};const timeout=setTimeout(done,5000)
     preview.onload=done;preview.onerror=done;preview.fetchPriority='low';if(img.sizes)preview.sizes=img.sizes;if(img.srcset)preview.srcset=img.srcset;preview.src=img.src
    })
   }
   running=false
  }
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(warm,350)}
  const observer=new MutationObserver(schedule)
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-app-tab']})
  schedule()
  window.addEventListener('brief:images-changed',schedule)
  return()=>{cancelled=true;clearTimeout(timer);observer.disconnect();window.removeEventListener('brief:images-changed',schedule);pending.forEach(img=>{img.onload=null;img.onerror=null})}
 },[pathname])
 return null
}
