'use client'

import {LIVE_DESK_ENABLED} from '../../lib/live-desk-state'
import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'
import {writers} from '../articles/writers'
import {sundayDeskMeta,sundayDeskPosts as fallbackPosts} from '../live-desk/data'

const API=process.env.NEXT_PUBLIC_BRIEF_ENV==='staging'?'/api/staging-disabled':'https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-live-desk'
const liveNow=()=>{
  if(!LIVE_DESK_ENABLED)return false
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date())
    const get=t=>parts.find(p=>p.type===t)?.value
    return get('weekday')==='Sun'&&(Number(get('hour'))>12||(Number(get('hour'))===12&&Number(get('minute'))>=45))
  }catch{return false}
}

export default function SundayLiveDesk({editionSlug=null,editionLabel='THE NEWSROOM',staffPath='/staff'}){
  const [posts,setPosts]=useState([])
  const [filter,setFilter]=useState('all')
  const [page,setPage]=useState(1)
  const pageSize=5
  const [isLive,setIsLive]=useState(false)
  const [loadState,setLoadState]=useState('loading')
  useEffect(()=>{
    const check=()=>setIsLive(liveNow())
    check()
    const clock=window.setInterval(check,30000)
    return()=>window.clearInterval(clock)
  },[])
  useEffect(()=>{
    if(!isLive)return
    let active=true
    const load=()=>fetch(API+'?action=live'+(editionSlug?'&edition='+encodeURIComponent(editionSlug):'')+'&_='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(({posts=[]})=>{if(active){setPosts([...posts].sort((a,b)=>new Date(b.sort_time||b.published_at||0)-new Date(a.sort_time||a.published_at||0)));setLoadState('ready')}}).catch(()=>{if(active)setLoadState('error')})
    load()
    const timer=window.setInterval(load,20000)
    return()=>{active=false;window.clearInterval(timer)}
  },[isLive,editionSlug])
  const todayNY=new Date().toLocaleDateString('en-US',{timeZone:'America/New_York'})
  const todaysPosts=posts.filter(p=>p.published_at&&new Date(p.published_at).toLocaleDateString('en-US',{timeZone:'America/New_York'})===todayNY)
  const normalized=todaysPosts.length?todaysPosts.map(p=>({...p,time:p.published_at?new Date(p.published_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}):'',id:p.id})):(editionSlug?[]:fallbackPosts)
  const visible=useMemo(()=>filter==='all'?normalized:normalized.filter(p=>p.writer===filter),[normalized,filter])
  const pageCount=Math.max(1,Math.ceil(visible.length/pageSize))
  const currentPage=Math.min(page,pageCount)
  const displayed=visible.slice((currentPage-1)*pageSize,currentPage*pageSize)
  const activeWriters=[...new Set(normalized.map(p=>p.writer))]

  if(!isLive)return null

  return <section className="sundayDesk section" id="live-desk" aria-label="Sunday Live Desk">
    <div className="sundayDeskBrand" aria-label="The Brief Sunday Live Desk">
      <span className="sundayDeskBrandLine"/>
      <div className="sundayDeskBrandLockup">
        <h2>SUNDAY <em>LIVE</em> DESK</h2>
      </div>
      <span className="sundayDeskBrandLine"/>
    </div>
    <div className="sundayDeskHead">
      <div>
        <small>{editionLabel} • LIVE WIRE</small>
      </div>
      <div className="deskStatus live"><i/> LIVE NOW</div>
    </div>
    <div className="deskFilters" aria-label="Filter live desk by writer">
      <button className={filter==='all'?'active':''} onClick={()=>{setFilter('all');setPage(1)}}>ALL</button>
      {activeWriters.map(key=><button key={key} className={filter===key?'active':''} onClick={()=>{setFilter(key);setPage(1)}}>{writers[key]?.name.split(' ')[0]?.toUpperCase()}</button>)}
    </div>
    <div className="sundayDeskFeed">
      {normalized.length===0&&<p className="deskEmpty" role="status" style={{padding:'24px 0',fontSize:'1rem',lineHeight:1.5}}>{loadState==='loading'?'Loading the live desk…':loadState==='error'?'The live desk is temporarily unavailable. We’ll retry shortly.':'The Sunday Crew desk is open. Coverage will appear here as reports come in.'}</p>}
      {displayed.map(post=>{
        const writer=writers[post.writer]
        if(!writer)return null
        return <article className="deskPost" key={post.id}>
          <Link className="deskWriter" href={`${staffPath}#${writer.slug}`}>
            <img src={writer.image} alt=""/>
            <span><b>{writer.name}</b><small>{writer.title}</small></span>
          </Link>
          <div className="deskPostMeta"><span>{post.time}</span><em>{post.tag}</em>{post.thread&&<small>{post.thread}</small>}</div>
          <div className="deskPostBody">{post.subject&&<b>{post.subject}</b>}<p>{post.text}</p>{post.source_url&&<a className="deskSourceLink" href={post.source_url} target="_blank" rel="noreferrer">SOURCE: {post.source_name||'REPORTING'} ↗</a>}</div>
        </article>
      })}
    </div>
    {pageCount>1&&<nav className="deskPagination" aria-label="Live desk pages">
      <button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>← NEWER</button>
      <span>PAGE {currentPage} OF {pageCount}</span>
      <button disabled={currentPage===pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>OLDER →</button>
    </nav>}
    <div className="sundayDeskFoot"><span>{sundayDeskMeta.standby}</span><b>Posts roll into Monday Morning Autopsy →</b></div>
  </section>
}
