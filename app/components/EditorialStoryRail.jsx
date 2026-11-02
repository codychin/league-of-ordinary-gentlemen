'use client';

import {useEffect,useRef,useState} from 'react';
import styles from './EditorialStoryRail.module.css';

export default function EditorialStoryRail({children}) {
  const rail=useRef(null);
  const [state,setState]=useState({desktop:false,start:true,end:true});
  useEffect(()=>{
    const element=rail.current,query=matchMedia('(min-width:980px)');
    const update=()=>setState({desktop:query.matches,start:element.scrollLeft<=1,end:element.scrollLeft+element.clientWidth>=element.scrollWidth-1});
    const observer=new ResizeObserver(update);observer.observe(element);
    element.addEventListener('scroll',update,{passive:true});query.addEventListener('change',update);update();
    return ()=>{observer.disconnect();element.removeEventListener('scroll',update);query.removeEventListener('change',update);};
  },[]);
  function move(direction){
    const element=rail.current;
    element.scrollBy({left:direction*element.clientWidth,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  }
  function onKeyDown(event){
    if(!state.desktop||event.target!==event.currentTarget)return;
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}
    if(event.key==='Home'||event.key==='End'){event.preventDefault();rail.current.scrollTo({left:event.key==='Home'?0:rail.current.scrollWidth,behavior:'instant'});}
  }
  return <>
    <div ref={rail} className={`mobileLowerCarousel ${styles.rail}`} aria-label="More editorial stories" role={state.desktop?'region':undefined} tabIndex={state.desktop?0:undefined} onKeyDown={onKeyDown}>{children}</div>
    <div className={styles.controls} aria-label="More editorial stories controls">
      <button type="button" aria-label="Previous editorial stories" disabled={state.start} onClick={()=>move(-1)}>←</button>
      <button type="button" aria-label="Next editorial stories" disabled={state.end} onClick={()=>move(1)}>→</button>
    </div>
  </>;
}
