'use client';

import {useEffect,useRef,useState} from 'react';
import styles from './EditorialStoryRail.module.css';

export default function EditorialStoryRail({children}) {
  const rail=useRef(null),animation=useRef(0);
  const [state,setState]=useState({desktop:false,start:true,end:true,progress:0});
  function cancel(){cancelAnimationFrame(animation.current);animation.current=0;if(rail.current)delete rail.current.dataset.animating;}
  useEffect(()=>{
    const element=rail.current,query=matchMedia('(min-width:980px)');
    const update=()=>{const max=Math.max(0,element.scrollWidth-element.clientWidth);setState({desktop:query.matches,start:element.scrollLeft<=1,end:element.scrollLeft>=max-1,progress:max?Math.max(0,Math.min(1,element.scrollLeft/max)):0});};
    const resize=()=>{cancel();update();};
    const observer=new ResizeObserver(resize);observer.observe(element);
    element.addEventListener('scroll',update,{passive:true});query.addEventListener('change',resize);
    for(const name of ['wheel','touchstart','pointerdown'])element.addEventListener(name,cancel,{passive:true});update();
    return ()=>{cancel();observer.disconnect();element.removeEventListener('scroll',update);query.removeEventListener('change',resize);for(const name of ['wheel','touchstart','pointerdown'])element.removeEventListener(name,cancel);};
  },[]);
  function move(direction){
    const element=rail.current;cancel();
    const step=(element.firstElementChild?.getBoundingClientRect().width||element.clientWidth)+parseFloat(getComputedStyle(element).columnGap||0);
    const from=element.scrollLeft,to=Math.max(0,Math.min(element.scrollWidth-element.clientWidth,from+direction*step));
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){element.scrollTo({left:to,behavior:'instant'});return;}
    const start=performance.now();element.dataset.animating='true';
    const frame=now=>{const t=Math.min(1,(now-start)/480),eased=t*t*(3-2*t);element.scrollTo({left:from+(to-from)*eased,behavior:'instant'});if(t<1)animation.current=requestAnimationFrame(frame);else cancel();};
    animation.current=requestAnimationFrame(frame);
  }
  function onKeyDown(event){
    if(!state.desktop||event.target!==event.currentTarget)return;
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}
    if(event.key==='Home'||event.key==='End'){event.preventDefault();cancel();rail.current.scrollTo({left:event.key==='Home'?0:rail.current.scrollWidth,behavior:'instant'});}
  }
  return <>
    <div ref={rail} className={`mobileLowerCarousel ${styles.rail}`} aria-label="More editorial stories" role={state.desktop?'region':undefined} tabIndex={state.desktop?0:undefined} onKeyDown={onKeyDown}>{children}</div>
    <div className={styles.controls} aria-label="More editorial stories controls">
      <button type="button" aria-label="Previous editorial stories" disabled={state.start} onClick={()=>move(-1)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>
      <span className={styles.progress} aria-hidden="true"><span style={{transform:`translateX(${state.progress*100}%)`}}/></span>
      <button type="button" aria-label="Next editorial stories" disabled={state.end} onClick={()=>move(1)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button>
    </div>
  </>;
}
