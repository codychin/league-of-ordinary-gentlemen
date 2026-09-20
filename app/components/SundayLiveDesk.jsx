'use client'

import {useEffect,useState} from 'react'
import Link from 'next/link'
import {writers} from '../articles/writers'
import {sundayDeskMeta,sundayDeskPosts} from '../live-desk/data'

const isSundayInNewYork=()=>{
  try{
    return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short'}).format(new Date())==='Sun'
  }catch{return false}
}

export default function SundayLiveDesk(){
  const [isSunday,setIsSunday]=useState(false)
  useEffect(()=>setIsSunday(isSundayInNewYork()),[])

  return <section className="sundayDesk section" aria-label="Sunday Live Desk">
    <div className="sundayDeskHead">
      <div>
        <small>THE NEWSROOM • LIVE WIRE</small>
        <h2>{sundayDeskMeta.title}</h2>
        <p>{sundayDeskMeta.dek}</p>
      </div>
      <span className={isSunday?'deskStatus live':'deskStatus'}>
        <i/>
        {isSunday?'LIVE':'PREVIEW'}
      </span>
    </div>

    <div className="sundayDeskFeed">
      {sundayDeskPosts.map(post=>{
        const writer=writers[post.writer]
        return <article className="deskPost" key={post.id}>
          <Link className="deskWriter" href={`/staff#${writer.slug}`}>
            <img src={writer.image} alt=""/>
            <span>
              <b>{writer.name}</b>
              <small>{writer.title}</small>
            </span>
          </Link>
          <div className="deskPostMeta"><span>{post.time}</span><em>{post.tag}</em></div>
          <p>{post.text}</p>
        </article>
      })}
    </div>

    <div className="sundayDeskFoot">
      <span>{sundayDeskMeta.standby}</span>
      <b>Posts roll into Monday Morning Autopsy →</b>
    </div>
  </section>
}
