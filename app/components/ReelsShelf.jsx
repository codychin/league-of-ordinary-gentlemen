'use client';

import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import styles from './ReelsShelf.module.css';

const STORAGE_KEY='brief-week3-reels-viewed-v1';

export default function ReelsShelf({reels=[]}){
  const [active,setActive]=useState(null);
  const [viewed,setViewed]=useState({});
  const [showMeta,setShowMeta]=useState(true);
  const [muted,setMuted]=useState(false);
  const [progress,setProgress]=useState(0);
  const touchStart=useRef(null);
  const videoRef=useRef(null);
  const preloadRef=useRef(null);
  const firstWarmRef=useRef(null);

  useEffect(()=>{
    try{setViewed(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}catch{}
  },[]);

  useEffect(()=>{
    if(!reels.length)return;
    let warm=null;
    const start=()=>{
      warm=document.createElement('video');
      warm.preload='auto';
      warm.muted=true;
      warm.playsInline=true;
      warm.src=`/reels/${reels[0].id}.mp4?v=12`;
      warm.style.position='fixed';
      warm.style.width='1px';
      warm.style.height='1px';
      warm.style.opacity='0.001';
      warm.style.pointerEvents='none';
      warm.style.left='-9999px';
      document.body.appendChild(warm);
      firstWarmRef.current=warm;
      warm.load();
    };
    const idle=window.requestIdleCallback?window.requestIdleCallback(start,{timeout:1200}):window.setTimeout(start,700);
    return()=>{
      if(window.cancelIdleCallback&&typeof idle==='number')window.cancelIdleCallback(idle);else clearTimeout(idle);
      if(warm){try{warm.pause()}catch{};warm.remove();if(firstWarmRef.current===warm)firstWarmRef.current=null}
    };
  },[reels]);

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

  const reportMediaEvent=(type,video)=>{
    try{
      const payload={
        type,
        reel:reel?.id||null,
        t:Number(video.currentTime||0).toFixed(2),
        duration:Number(video.duration||0).toFixed(2),
        readyState:video.readyState,
        networkState:video.networkState,
        paused:video.paused
      };
      console.info('[reel-media]',payload);
      window.sessionStorage.setItem('brief-last-reel-media-event',JSON.stringify({...payload,at:Date.now()}));
      if(['waiting','stalled','error','playing'].includes(type)){
        fetch('/api/reel-diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
      }
    }catch{}
  };

  const move=dir=>{
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
  const nextReel=active===null||!reels.length?null:reels[(active+1)%reels.length];

  return <section className={styles.wrap} aria-label="Week 3 video dispatches">
    <div className={styles.head}>
      <div><small>THE BRIEF • FIELD DISPATCHES</small><h2>Week 3, on assignment.</h2></div>
      <span>6 MATCHUPS • 6 CORRESPONDENTS</span>
    </div>
    <div className={styles.rail}>
      {reels.map((r,i)=><button className={`${styles.story} ${viewed[r.id]?styles.seen:styles.unseen}`} key={r.id} onClick={()=>openReel(i)} aria-label={`Watch ${r.matchup} dispatch by ${r.correspondent}`}>
        <span className={styles.thumb}>
          <span className={styles.playerLeft}><img src={r.leftImage} alt="" loading={i<4?'eager':'lazy'} decoding="async"/></span>
          <span className={styles.playerRight}><img src={r.rightImage} alt="" loading={i<4?'eager':'lazy'} decoding="async"/></span>
          <span className={styles.cardShade}/>
          <span className={styles.vs}>VS</span>
          <img className={styles.avatar} src={r.avatar} alt="" loading={i<4?'eager':'lazy'} decoding="async"/>
          <span className={styles.storyCopy}><b>{r.short}</b><small>{r.correspondent.split(' ')[0]}</small></span>
        </span>
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
        {nextReel&&<video
          key={nextReel.id}
          ref={preloadRef}
          className={`${styles.video} ${styles.nextVideo}`}
          src={`/reels/${nextReel.id}.mp4?v=12`}
          preload="auto"
          playsInline
          muted
          disablePictureInPicture
          aria-hidden="true"
          onLoadedData={e=>{
            const v=e.currentTarget;
            v.muted=true;
            const p=v.play();
            if(p?.then)p.then(()=>{v.pause();try{v.currentTime=.01}catch{}}).catch(()=>{});
          }}
        />}
        <video
          key={reel.id}
          ref={videoRef}
          className={styles.video}
          src={`/reels/${reel.id}.mp4?v=12`}
          autoPlay
          muted={muted}
          playsInline
          preload="auto"
          disablePictureInPicture
          onLoadedData={e=>{reportMediaEvent('loadeddata',e.currentTarget);videoRef.current?.play().catch(()=>{})}}
          onCanPlay={e=>reportMediaEvent('canplay',e.currentTarget)}
          onPlaying={e=>reportMediaEvent('playing',e.currentTarget)}
          onWaiting={e=>reportMediaEvent('waiting',e.currentTarget)}
          onStalled={e=>reportMediaEvent('stalled',e.currentTarget)}
          onSuspend={e=>reportMediaEvent('suspend',e.currentTarget)}
          onError={e=>reportMediaEvent('error',e.currentTarget)}
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
