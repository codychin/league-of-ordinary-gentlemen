'use client';
import {useMemo, useRef, useState, useEffect} from 'react';
import Link from 'next/link';
import CratesViews from './CratesViews';
import ResilientImage from './ResilientImage';
import {CRATE_TOPICS, FEATURED_CRATE_SLUGS, filterCrateArticles} from '../../lib/crates.mjs';
import styles from './Crates.module.css';

function Arrow({down=false}) {return <svg className={styles.arrow} viewBox="0 0 20 20" aria-hidden="true" focusable="false" style={down?{transform:'rotate(90deg)'}:undefined}><path d="M3 10h13M11 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>}
function Story({story,lead=false}) {
  return <Link className={`${styles.story} ${lead?styles.lead:''} ${!story.image?styles.textStory:''}`} href={story.href}>
    {story.image&&<ResilientImage className={styles.image} src={story.image} alt={story.imageAlt} sizes={lead?'(max-width:700px) 100vw, 640px':'(max-width:700px) 100vw, 380px'} loading={lead?'eager':'lazy'} style={story.imageObjectPosition?{objectPosition:story.imageObjectPosition}:undefined}/>}
    <div className={styles.copy}><span className={styles.topic}>{story.topic||story.section||'From the newsroom'}</span><h3>{story.title}</h3><p>{story.dek}</p><div className={styles.meta}>{story.by}{story.date&&<> <span>· <time dateTime={story.isoDate||undefined}>{story.date}</time></span></>}{story.week&&<span> · Week {story.week}</span>}</div><span className={styles.read}>Read the story <Arrow/></span></div>
  </Link>;
}
export default function Crates({articles,root='',editionName='LOOG'}) {
  const [query,setQuery]=useState(''),[topic,setTopic]=useState(''),[author,setAuthor]=useState(''),[order,setOrder]=useState('newest'),[limit,setLimit]=useState(9);
  const grid=useRef(null), focusIndex=useRef(null);
  const featured=FEATURED_CRATE_SLUGS.map(slug=>articles.find(a=>a.slug===slug)).filter(Boolean);
  const authors=useMemo(()=>[...new Set(articles.map(a=>a.by))].sort(),[articles]);
  const matches=useMemo(()=>filterCrateArticles(articles,{query,topic,author,order}),[articles,query,topic,author,order]);
  const shown=matches.slice(0,limit),active=!!(query||topic||author);
  function change(setter,value){focusIndex.current=null;setter(value);setLimit(9)}
  function reset(){setQuery('');setTopic('');setAuthor('');setLimit(9);focusIndex.current=null}
  useEffect(()=>{if(focusIndex.current!==null){grid.current?.children[focusIndex.current]?.focus({preventScroll:true});focusIndex.current=null}},[limit]);
  return <main className={styles.crates}>
    <section className={styles.intro}><div><span className={styles.eyebrow}>Good stories. Long shelf life.</span><h1>The Crates<span>.</span></h1></div><div className={styles.introCopy}><p>A few worth pulling out.<br/>A whole lot worth digging through.</p><a href="#browse-crates">Find your next read <Arrow down/></a></div></section>
    <CratesViews root={root} editionName={editionName} current="read"/>
    {featured.length>0&&<><div className={styles.sectionLabel}><h2>Start somewhere good</h2><span>A selection from the shelves</span></div><section className={styles.features} aria-label="A selection from the shelves"><Story story={featured[0]} lead/><div className={styles.discoveries}>{featured.slice(1).map(a=><Story story={a} key={a.slug}/>)}</div></section></>}
    <section className={styles.browse} id="browse-crates" aria-labelledby="browse-title"><div className={styles.browseHead}><div><span className={styles.eyebrow}>Follow your curiosity</span><h2 id="browse-title">Dig in.</h2></div><label className={styles.search}><span>Search the Crates</span><input type="search" placeholder="A story, a name, an obsession…" value={query} onChange={e=>change(setQuery,e.target.value)}/></label></div>
    <div className={styles.chips} role="group" aria-label="Filter by topic">{['',...CRATE_TOPICS].map(t=><button key={t} type="button" aria-pressed={topic===t} onClick={()=>change(setTopic,t)}>{t||'Everything'}</button>)}</div>
    <div className={styles.toolbar}><p role="status" aria-live="polite" aria-atomic="true">{matches.length} {matches.length===1?'story':'stories'} <span> / {topic||'All shelves'}</span>{matches.length>shown.length&&<span className={styles.shown}>Showing {shown.length} of {matches.length}</span>}</p><div className={styles.selects}><label>By correspondent<select aria-label="By correspondent" value={author} onChange={e=>change(setAuthor,e.target.value)}><option value="">All voices</option>{authors.map(name=><option key={name}>{name}</option>)}</select></label><label>Order<select aria-label="Order" value={order} onChange={e=>change(setOrder,e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>{active&&<button className={styles.clear} type="button" onClick={reset}>Clear filters</button>}</div></div>
    <div className={styles.grid} ref={grid}>{shown.map(a=><Story story={a} key={a.slug}/>)}</div>
    {!matches.length&&<div className={styles.empty}><h3>Nothing in this crate yet.</h3><p>Try another name or a broader search.</p><button type="button" onClick={reset}>Clear filters</button></div>}
    {shown.length<matches.length&&<button className={styles.more} type="button" onClick={()=>{focusIndex.current=shown.length;setLimit(n=>n+9)}}>Keep digging <Arrow down/></button>}
    </section><div className={styles.foot}><strong>The Brief</strong><p>Every take preserved long enough to become evidence.</p></div>
  </main>;
}
