'use client'

import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'
import {writers} from '../articles/writers'
import {sundayDeskMeta,sundayDeskPosts as fallbackPosts} from '../live-desk/data'

const API='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-live-desk'
const liveNow=()=>{
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date())
    const get=t=>parts.find(p=>p.type===t)?.value
    return get('weekday')==='Sun'&&(Number(get('hour'))>12||(Number(get('hour'))===12&&Number(get('minute'))>=30))
  }catch{return false}
}

export default function SundayLiveDesk(){
  const [isLive,setIsLive]=useState(false)
  const [posts,setPosts]=useState([])
  const [filter,setFilter]=useState('all')
  useEffect(()=>{
    setIsLive(liveNow())
    let active=true
    const load=()=>fetch(API+'?action=live',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(({posts=[]})=>{if(active)setPosts(posts)}).catch(()=>{})
    load()
    const timer=window.setInterval(load,20000)
    return()=>{active=false;window.clearInterval(timer)}
  },[])
  const normalized=posts.length?posts.map(p=>({...p,time:p.published_at?new Date(p.published_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'}):'',id:p.id})):fallbackPosts
  const visible=useMemo(()=>filter==='all'?normalized:normalized.filter(p=>p.writer===filter),[normalized,filter])
  const activeWriters=[...new Set(normalized.map(p=>p.writer))]

  return <section className="sundayDesk section" id="live-desk" aria-label="Sunday Live Desk">
    <div className="sundayDeskHead">
      <div>
        <small>THE NEWSROOM • LIVE WIRE</small>
        <h2>{sundayDeskMeta.title}</h2>
        <p>{sundayDeskMeta.dek}</p>
      </div>
      <span className={isLive?'deskStatus live':'deskStatus'}><i/>{isLive?'LIVE':'PREVIEW'}</span>
    </div>
    <div className="deskFilters" aria-label="Filter live desk by writer">
      <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>ALL</button>
      {activeWriters.map(key=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{writers[key]?.name.split(' ')[0]?.toUpperCase()}</button>)}
    </div>
    <div className="sundayDeskFeed">
      {visible.map(post=>{
        const writer=writers[post.writer]
        if(!writer)return null
        return <article className="deskPost" key={post.id}>
          <Link className="deskWriter" href={`/staff#${writer.slug}`}>
            <img src={writer.image} alt=""/>
            <span><b>{writer.name}</b><small>{writer.title}</small></span>
          </Link>
          <div className="deskPostMeta"><span>{post.time}</span><em>{post.tag}</em>{post.thread&&<small>{post.thread}</small>}</div>
          <div className="deskPostBody">{post.subject&&<b>{post.subject}</b>}<p>{post.text}</p></div>
        </article>
      })}
    </div>
    <div className="sundayDeskFoot"><span>{sundayDeskMeta.standby}</span><b>Posts roll into Monday Morning Autopsy →</b></div>
  </section>
}
