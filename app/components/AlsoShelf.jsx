'use client';

import {useEffect,useRef,useState} from 'react';
import styles from './AlsoShelf.module.css';

export default function AlsoShelf({videos=[]}){
  const [active,setActive]=useState(null);
  const [muted,setMuted]=useState(false);\n  const [progress,setProgress]=useState(0);
  const videoRef=useRef(null);
  const touchStart=useRef(null);

  useEffect(()=>{
    if(active===null)return;
    const old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    document.body.classList.add('reelsOpen');
    return()=>{document.body.style.overflow=old;document.body.classList.remove('reelsOpen')};
  },[active]);

  useEffect(()=>{
    const onKey=e=>{
      if(active===null)return;
      if(e.key==='Escape')setActive(null);
      if(e.key==='ArrowRight')setActive(i=>(i+1)%videos.length);
      if(e.key==='ArrowLeft')setActive(i=>(i-1+videos.length)%videos.length);
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[active,videos.length]);

  const move=dir=>{setProgress(0);setActive(i=>(i+dir+videos.length)%videos.length)};
  const open=i=>{setProgress(0);setMuted(false);setActive(i)};
  const item=active===null?null:videos[active];

  return <section className={styles.wrap} aria-label="Also, from The Brief">
    <div className={styles.head}><h2>also…</h2></div>
    <div className={styles.rail}>
      {videos.map((v,i)=><button type="button" className={styles.card} key={v.id} onClick={()=>open(i)} aria-label={`Watch ${v.title} by ${v.correspondent}`}>
        <span className={styles.thumb}>
          <img src={v.poster} alt="" loading="lazy" decoding="async"/>
          <span className={styles.shade}/>
          <span className={styles.play} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8.5 5.5v13l10-6.5z"/></svg></span>
        </span>
        <span className={styles.copy}><b>{v.correspondent}</b><small>{v.title}</small></span>
      </button>)}
    </div>

    {item&&<div className={styles.viewer} role="dialog" aria-modal="true" aria-label={`${item.title} by ${item.correspondent}`}
      onTouchStart={e=>{touchStart.current=e.touches[0].clientX}}
      onTouchEnd={e=>{if(touchStart.current===null)return;const d=e.changedTouches[0].clientX-touchStart.current;if(Math.abs(d)>55)move(d<0?1:-1);touchStart.current=null}}>
      <button className={styles.close} onClick={()=>setActive(null)} aria-label="Close video">×</button>
      <div className={styles.stage}>
        <video ref={videoRef} key={item.id} className={styles.video} src={item.src} poster={item.poster} autoPlay muted={muted} playsInline preload="auto" onLoadedMetadata={()=>setProgress(0)} onTimeUpdate={e=>{const v=e.currentTarget;setProgress(v.duration?Math.min(1,v.currentTime/v.duration):0)}} onEnded={()=>move(1)}/>
        <button className={styles.sound} onClick={()=>setMuted(v=>!v)} aria-label={muted?'Turn sound on':'Mute'}>{muted?'⌁':'◖'}</button>
        <button className={`${styles.tap} ${styles.prev}`} onClick={()=>move(-1)} aria-label="Previous video"/>
        <button className={`${styles.tap} ${styles.next}`} onClick={()=>move(1)} aria-label="Next video"/>
        <div className={styles.meta}><small>THE BRIEF • ALSO…</small><b>{item.title}</b><span>{item.correspondent}</span></div>
      </div>
      <div className={styles.progress}>{videos.map((v,i)=><span key={v.id} className={i<active?styles.done:(i===active?styles.current:'')}><i style={i<active?{width:'100%'}:i===active?{width:`${progress*100}%`}:{width:'0%'}}/></span>)}</div>
    </div>}
  </section>
}
