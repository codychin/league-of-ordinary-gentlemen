'use client';

import {useRef,useState} from 'react';

export default function EditorialVideo({src,poster,className='',ariaLabel='Editorial video'}){
  const ref=useRef(null);
  const [playing,setPlaying]=useState(false);
  const [progress,setProgress]=useState(0);

  const toggle=()=>{
    const v=ref.current;
    if(!v)return;
    if(v.paused){v.play().catch(()=>{});}else{v.pause();}
  };

  return <div className={`editorialVideo ${className}`}>
    <video
      ref={ref}
      src={src}
      poster={poster}
      playsInline
      preload="metadata"
      aria-label={ariaLabel}
      onClick={toggle}
      onPlay={()=>setPlaying(true)}
      onPause={()=>setPlaying(false)}
      onEnded={()=>setPlaying(false)}
      onTimeUpdate={e=>{const v=e.currentTarget;setProgress(v.duration?Math.min(1,v.currentTime/v.duration):0)}}
    />
    <button type="button" className={`editorialVideoPlay ${playing?'isPlaying':''}`} onClick={toggle} aria-label={playing?'Pause video':'Play video'}>
      {playing?<span className="editorialPauseIcon"><i/><i/></span>:<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5v13l10-6.5z"/></svg>}
    </button>
    <div className="editorialVideoProgress" aria-hidden="true"><i style={{width:`${progress*100}%`}}/></div>
  </div>
}
