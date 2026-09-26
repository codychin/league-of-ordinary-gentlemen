'use client';

import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import styles from './ReelsShelf.module.css';

const STORAGE_KEY='brief-week3-reels-viewed-v1';

export default function ReelsShelf({reels=[]}){
  const [active,setActive]=useState(0);
  const [open,setOpen]=useState(false);
  const [viewed,setViewed]=useState({});
  const [showMeta,setShowMeta]=useState(true);
  const [ios,setIos]=useState(false);
  const [standalone,setStandalone]=useState(false);
  const [muted,setMuted]=useState(false);
  const touchStart=useRef(null);
  const videoRef=useRef(null);

  useEffect(()=>{
    const ua=navigator.userAgent||'';
    const appMode=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
    setStandalone(appMode);
    setIos(/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||appMode);
    try{setViewed(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}catch{}
  },[]);

  useEffect(()=>{
    if(!open||!reels.length)return;
    const reel=reels[active];
    const next={...viewed,[reel.id]:true};
    setViewed(next);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}catch{}
    setShowMeta(true);
    const t=setTimeout(()=>setShowMeta(false),2800);
    const old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    document.body.classList.add('reelsOpen');
    return()=>{clearTimeout(t);document.body.style.overflow=old;document.body.classList.remove('reelsOpen')};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active,open]);

  useEffect(()=>{
    const onKey=e=>{
      if(!open)return;
      if(e.key==='Escape')setActive(null);
      if(e.key==='ArrowRight')setActive(i=>(i+1)%reels.length);
      if(e.key==='ArrowLeft')setActive(i=>(i-1+reels.length)%reels.length);
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[open,reels.length]);

  useEffect(()=>{
    if(!open)return;
    const video=videoRef.current;
    if(!video)return;
    video.muted=muted;
    video.defaultMuted=muted;
    const tryPlay=()=>{
      const promise=video.play();
      if(promise?.catch)promise.catch(()=>{});
    };
    tryPlay();
    video.addEventListener('loadedmetadata',tryPlay);
    video.addEventListener('canplay',tryPlay);
    return()=>{
      video.removeEventListener('loadedmetadata',tryPlay);
      video.removeEventListener('canplay',tryPlay);
    };
  },[active,muted,open]);

  const move=dir=>setActive(i=>(i+dir+reels.length)%reels.length);
  const openReel=i=>{
    flushSync(()=>{setActive(i);setOpen(true);setMuted(false)});
    const video=videoRef.current;
    if(!video)return;
    video.muted=false;
    video.play().catch(()=>{
      video.muted=true;
      setMuted(true);
      video.play().catch(()=>{});
    });
  };
  const reel=reels[active]||null;

  return <section className={styles.wrap} aria-label="Week 3 video dispatches">
    <div className={styles.head}>
      <div><small>THE BRIEF • FIELD DISPATCHES</small><h2>Week 3, on assignment.</h2></div>
      <span>6 MATCHUPS • 6 CORRESPONDENTS</span>
    </div>
    <div className={styles.rail}>
      {reels.map((r,i)=><button className={styles.story} key={r.id} onClick={()=>openReel(i)} aria-label={`Watch ${r.matchup} dispatch by ${r.correspondent}`}>
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

    {reel&&<div className={styles.viewer} style={open?undefined:{visibility:'hidden',pointerEvents:'none'}}
      role="dialog" aria-modal="true" aria-label={`${reel.matchup} video dispatch`}
      onTouchStart={e=>{touchStart.current=e.touches[0].clientX}}
      onTouchEnd={e=>{
        if(touchStart.current===null)return;
        const d=e.changedTouches[0].clientX-touchStart.current;
        if(Math.abs(d)>55)move(d<0?1:-1);
        touchStart.current=null;
      }}>
      <button className={styles.close} onClick={()=>setOpen(false)} aria-label="Close video">×</button>
      <div className={styles.stage}>
        <video ref={videoRef} className={styles.video} src={standalone?`/api/reel-video/${reel.id}?v=5`:`/reels/${reel.id}.mp4?v=5`} autoPlay muted={muted} playsInline preload="auto" disablePictureInPicture onLoadedData={()=>videoRef.current?.play().catch(()=>{})} onEnded={()=>move(1)}/>
        <button className={styles.soundToggle} onClick={e=>{e.stopPropagation();setMuted(v=>!v)}} aria-label={muted?'Turn sound on':'Mute'}>{muted?'SOUND ON':'MUTE'}</button>
        <button className={`${styles.tapZone} ${styles.tapPrev}`} onClick={()=>move(-1)} aria-label="Previous reel"/>
        <button className={`${styles.tapZone} ${styles.tapNext}`} onClick={()=>move(1)} aria-label="Next reel"/>
        <div className={`${styles.meta} ${showMeta?styles.metaOn:''}`}>
          <small>WEEK 3 • FIELD DISPATCH</small>
          <b>{reel.matchup}</b>
          <span>{reel.correspondent}</span>
        </div>
        
      </div>
      <div className={styles.progress}>{reels.map((r,i)=><span key={r.id} className={i===active?styles.current:(viewed[r.id]?styles.done:'')}/>)}</div>
    </div>}
  </section>
}
