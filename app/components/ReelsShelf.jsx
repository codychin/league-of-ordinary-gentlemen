'use client';

import {useEffect,useRef,useState} from 'react';
import styles from './ReelsShelf.module.css';

const STORAGE_KEY='brief-week3-reels-viewed-v1';

export default function ReelsShelf({reels=[]}){
  const [active,setActive]=useState(null);
  const [viewed,setViewed]=useState({});
  const [showMeta,setShowMeta]=useState(true);
  const touchStart=useRef(null);

  useEffect(()=>{
    try{setViewed(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}catch{}
  },[]);

  useEffect(()=>{
    if(active===null)return;
    const reel=reels[active];
    const next={...viewed,[reel.id]:true};
    setViewed(next);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}catch{}
    setShowMeta(true);
    const t=setTimeout(()=>setShowMeta(false),2800);
    const old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{clearTimeout(t);document.body.style.overflow=old};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active]);

  useEffect(()=>{
    const onKey=e=>{
      if(active===null)return;
      if(e.key==='Escape')setActive(null);
      if(e.key==='ArrowRight')setActive(i=>(i+1)%reels.length);
      if(e.key==='ArrowLeft')setActive(i=>(i-1+reels.length)%reels.length);
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[active,reels.length]);

  const move=dir=>setActive(i=>(i+dir+reels.length)%reels.length);
  const reel=active===null?null:reels[active];

  return <section className={styles.wrap} aria-label="Week 3 video dispatches">
    <div className={styles.head}>
      <div><small>THE BRIEF • FIELD DISPATCHES</small><h2>Week 3, on assignment.</h2></div>
      <span>6 MATCHUPS • 6 CORRESPONDENTS</span>
    </div>
    <div className={styles.rail}>
      {reels.map((r,i)=><button className={styles.story} key={r.id} onClick={()=>setActive(i)} aria-label={`Watch ${r.matchup} dispatch by ${r.correspondent}`}>
        <span className={`${styles.ring} ${viewed[r.id]?styles.seen:styles.unseen}`}>
          <span className={styles.thumb}>
            <span className={styles.playerLeft}><img src={r.leftImage} alt=""/></span>
            <span className={styles.playerRight}><img src={r.rightImage} alt=""/></span>
            <span className={styles.vs}>VS</span>
            <img className={styles.avatar} src={r.avatar} alt=""/>
          </span>
        </span>
        <b>{r.short}</b>
        <small>{r.correspondent.split(' ')[0]}</small>
      </button>)}
    </div>

    {reel&&<div className={styles.viewer}
      role="dialog" aria-modal="true" aria-label={`${reel.matchup} video dispatch`}
      onTouchStart={e=>{touchStart.current=e.touches[0].clientX}}
      onTouchEnd={e=>{
        if(touchStart.current===null)return;
        const d=e.changedTouches[0].clientX-touchStart.current;
        if(Math.abs(d)>55)move(d<0?1:-1);
        touchStart.current=null;
      }}>
      <button className={styles.close} onClick={()=>setActive(null)} aria-label="Close video">×</button>
      <div className={styles.stage} onClick={()=>setShowMeta(true)}>
        <video key={reel.videoUrl} className={styles.video} src={reel.videoUrl} autoPlay playsInline controls preload="metadata"/>
        <div className={`${styles.meta} ${showMeta?styles.metaOn:''}`}>
          <small>WEEK 3 • FIELD DISPATCH</small>
          <b>{reel.matchup}</b>
          <span>{reel.correspondent}</span>
        </div>
        <button className={`${styles.nav} ${styles.prev}`} onClick={e=>{e.stopPropagation();move(-1)}} aria-label="Previous reel">‹</button>
        <button className={`${styles.nav} ${styles.next}`} onClick={e=>{e.stopPropagation();move(1)}} aria-label="Next reel">›</button>
      </div>
      <div className={styles.progress}>{reels.map((r,i)=><span key={r.id} className={i===active?styles.current:(viewed[r.id]?styles.done:'')}/>)}</div>
    </div>}
  </section>
}
