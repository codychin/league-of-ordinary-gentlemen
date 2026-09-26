'use client';

import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import styles from './ReelsShelf.module.css';

const STORAGE_KEY='brief-week3-reels-viewed-v1';

export default function ReelsShelf({reels=[]}){
  const [active,setActive]=useState(null);
  const [viewed,setViewed]=useState({});
  const [showMeta,setShowMeta]=useState(true);
  const [ios,setIos]=useState(false);
  const [muted,setMuted]=useState(false);
  const [progress,setProgress]=useState(0);
  const [switching,setSwitching]=useState(false);
  const touchStart=useRef(null);
  const videoRef=useRef(null);

  useEffect(()=>{
    const ua=navigator.userAgent||'';
    const appMode=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
    setIos(/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||appMode);
    try{setViewed(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}catch{}
  },[]);

  useEffect(()=>{
    if(active===null||!reels.length)return;
    const reel=reels[active];
    const next={...viewed,[reel.id]:true};
    setViewed(next);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}catch{}
    setShowMeta(true);
    setProgress(0);
    const t=setTimeout(()=>setShowMeta(false),2800);
    const old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    document.body.classList.add('reelsOpen');
    return()=>{clearTimeout(t);document.body.style.overflow=old;document.body.classList.remove('reelsOpen')};
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

  useEffect(()=>{
    if(active===null)return;
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
  },[active,muted]);

  const move=dir=>{
    setSwitching(true);
    setProgress(0);
    setActive(i=>(i+dir+reels.length)%reels.length);
  };
  const openReel=i=>{
    flushSync(()=>{setActive(i);setMuted(false)});
    const video=videoRef.current;
    if(!video)return;
    video.muted=false;
    video.play().catch(()=>{
      video.muted=true;
      setMuted(true);
      video.play().catch(()=>{});
    });
  };
  const reel=active===null?null:reels[active];

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
      <div className={styles.stage}>
        <video
          ref={videoRef}
          className={`${styles.video} ${switching?styles.switching:''}`}
          src={`/reels/${reel.id}.mp4?v=7`}
          autoPlay
          muted={muted}
          playsInline
          preload="auto"
          disablePictureInPicture
          onLoadedData={()=>{setSwitching(false);videoRef.current?.play().catch(()=>{})}}
          onTimeUpdate={e=>{const v=e.currentTarget;setProgress(v.duration?Math.min(1,v.currentTime/v.duration):0)}}
          onEnded={()=>move(1)}
        />
        <button className={styles.soundToggle} onClick={e=>{e.stopPropagation();setMuted(v=>!v)}} aria-label={muted?'Turn sound on':'Mute'}>
          {muted
            ?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.8 8.4H3.5v7.2h3.3L11 19z"/><path d="m15.5 9.5 5 5m0-5-5 5"/></svg>
            :<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.8 8.4H3.5v7.2h3.3L11 19z"/><path d="M15 9.2c1.1.8 1.8 1.7 1.8 2.8s-.7 2-1.8 2.8"/><path d="M17.8 6.8c2 1.4 3.2 3.1 3.2 5.2s-1.2 3.8-3.2 5.2"/></svg>}
        </button>
        <button className={`${styles.tapZone} ${styles.tapPrev}`} onClick={()=>move(-1)} aria-label="Previous reel"/>
        <button className={`${styles.tapZone} ${styles.tapNext}`} onClick={()=>move(1)} aria-label="Next reel"/>
        <div className={`${styles.meta} ${showMeta?styles.metaOn:''}`}>
          <small>WEEK 3 • FIELD DISPATCH</small>
          <b>{reel.matchup}</b>
          <span>{reel.correspondent}</span>
        </div>
        
      </div>
      <div className={styles.progress}>{reels.map((r,i)=><span key={r.id} className={i<active?styles.done:(i===active?styles.current:'')}><i style={i<active?{width:'100%'}:i===active?{width:`${progress*100}%`}:{width:'0%'}}/></span>)}</div>
    </div>}
  </section>
}
