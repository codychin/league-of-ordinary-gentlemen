'use client';
import {useState,useRef,useEffect} from 'react';
import Link from 'next/link';
import ResilientImage from './ResilientImage';
import s from './WatchCrates.module.css';
const duration=n=>Number.isFinite(n)?`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`:null;
function FilmImage({film,...props}){
 const [fallback,setFallback]=useState(false);
 return <ResilientImage {...props} src={fallback&&film.fallbackPoster?film.fallbackPoster:film.poster} onError={()=>setFallback(true)}/>;
}
export default function WatchCrates({features,matchups,root='',editionName='LOOG'}){
 const [active,setActive]=useState(features[0]),[playing,setPlaying]=useState(false),[voice,setVoice]=useState(''),[query,setQuery]=useState(''),[type,setType]=useState(''),[kind,setKind]=useState(''),[week,setWeek]=useState('7'),[season,setSeason]=useState('2026'),[nativeHls,setNativeHls]=useState(false),[failed,setFailed]=useState(false);
 const player=useRef(null),video=useRef(null);
 useEffect(()=>{setNativeHls(!!document.createElement('video').canPlayType('application/vnd.apple.mpegurl'))},[]);
 const select=v=>{setActive(v);setPlaying(true);setFailed(false);player.current?.scrollIntoView({behavior:'instant',block:'start'});player.current?.focus({preventScroll:true})};
 const voices=[...new Set(features.map(v=>v.correspondent))].sort();
 const shown=features.filter(v=>(!voice||v.correspondent===voice)&&(!type||v.kind===type)&&`${v.title} ${v.correspondent} ${v.dek||''}`.toLowerCase().includes(query.toLowerCase()));
 const games=matchups.filter(v=>(!kind||v.kind===kind)&&String(v.week)===week&&String(v.season)===season);
 const card=v=><button type="button" className={s.card} key={v.id} onClick={()=>select(v)} aria-label={`Watch ${v.title} by ${v.correspondent}`}><span className={s.picture}><FilmImage film={v} alt="" loading="lazy" sizes="(max-width:700px) 100vw, 400px"/><span className={s.play}>▶</span>{duration(v.durationSeconds)&&<span className={s.duration}>{duration(v.durationSeconds)}</span>}</span><span className={s.tag}>{v.kind} · {v.correspondent}</span><h3>{v.title}</h3></button>;
 return <main className={s.watch}>
  <div className={s.intro}><div><span className={s.eyebrow}>Good stories. Another way in.</span><h1>The Crates<span>.</span></h1></div><p>From the field. From the desk.<br/>Worth sitting down for.</p></div>
  <nav className={s.tabs} aria-label="The Crates views"><Link href={`${root}/archive`}>Read</Link><a href={`${root}/archive/watch`} aria-current="page">Watch <span>▶</span></a><span className={s.edition}>{editionName} EDITION</span></nav>
  <section className={s.selection} aria-label="Selected story" ref={player} tabIndex={-1}>
   <div className={s.screen}>{playing?<><video ref={video} key={active.id} controls playsInline autoPlay preload="metadata" poster={active.poster} src={nativeHls&&active.hls?active.hls:active.src} aria-label={active.title} onError={()=>setFailed(true)}/>{failed&&<p className={s.error}>This video couldn’t load. <a href={active.src}>Open the original video ↗</a></p>}</>:<button className={s.cover} onClick={()=>setPlaying(true)} aria-label={`Play ${active.title}`}><FilmImage key={active.id} film={active} alt="" loading="eager" sizes="(max-width:700px) 100vw, 850px"/><span><b>▶</b> Play the film{duration(active.durationSeconds)&&` · ${duration(active.durationSeconds)}`}</span></button>}</div>
   <div className={s.featureCopy}><span className={s.eyebrow}>{active.week?`${editionName} · ${active.season} · Week ${active.week} · ${active.kind}`:'The screening room'}</span><h2>{active.title}</h2><p className={s.by}>{active.correspondent}</p>{active.dek&&<p className={s.dek}>{active.dek}</p>}{active.slug&&<Link href={`${root}/articles/${active.slug}`} className={s.read}>Read the dispatch ↗</Link>}</div>
  </section>
  <section className={s.browse} aria-labelledby="films-heading"><div className={s.heading}><div><span className={s.eyebrow}>The correspondent collection</span><h2 id="films-heading">Stay a while.</h2></div><label>Find a film<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="A story, a voice, a place…"/></label></div>
   <div className={s.toolbar}><div className={s.chips}>{['','Feature','Dispatch'].map(t=><button key={t} aria-pressed={type===t} onClick={()=>setType(t)}>{t||'All films'}</button>)}</div><label>Correspondent<select value={voice} onChange={e=>setVoice(e.target.value)}><option value="">All voices</option>{voices.map(n=><option key={n}>{n}</option>)}</select></label></div>
   <p className={s.results} role="status">{shown.length} films on this shelf</p><div className={s.grid}>{shown.map(card)}</div>{!shown.length&&<p>No films match. <button onClick={()=>{setVoice('');setQuery('');setType('')}}>Clear filters</button></p>}
  </section>
  <section className={s.matchups} aria-labelledby="games-heading"><div className={s.heading}><div><span className={s.eyebrow}>Your league. Its own shelf.</span><h2 id="games-heading">The weekly tape.</h2></div><p>Matchup previews &amp; recaps.<br/>Filed by league, season and week.</p></div>
   <div className={s.gameFilters}><label>League<select aria-label="League edition" value={root||'/'} onChange={e=>window.location.assign(`${e.target.value==='/'?'':e.target.value}/archive/watch#games-heading`)}><option value="/">LOOG</option><option value="/sunday-crew">Sunday Crew</option><option value="/doge">DOGE4</option></select></label><label>Season<select value={season} onChange={e=>setSeason(e.target.value)}>{[...new Set(matchups.map(v=>v.season))].map(n=><option key={n}>{n}</option>)}</select></label><label>Week<select value={week} onChange={e=>setWeek(e.target.value)}>{[...new Set(matchups.map(v=>v.week))].map(n=><option key={n} value={n}>Week {n}</option>)}</select></label><label>Coverage<select value={kind} onChange={e=>setKind(e.target.value)}><option value="">Previews &amp; recaps</option><option value="preview">Previews</option><option value="recap">Recaps</option></select></label></div>
   <p className={s.results} role="status">{editionName} · {season} · Week {week} · {games.length} videos</p><div className={`${s.grid} ${s.games}`}>{games.map(card)}</div>{!games.length&&<p>No published videos on this shelf.</p>}
  </section><footer className={s.footer}><b>The Brief</b><span>Good stories. Long shelf life.</span><Link href={`${root}/archive`}>Back to the written archive ↗</Link></footer>
 </main>
}
