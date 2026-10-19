'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {isSundayLiveWindow} from '../../lib/live-desk-state'
export default function LiveDeskNav({root=''}){
  const [live,setLive]=useState(false)
  useEffect(()=>{const check=()=>setLive(isSundayLiveWindow());check();const timer=setInterval(check,30000);return()=>clearInterval(timer)},[])
  return <Link href={live?root+'/#live-desk':root+'/live-desk'}>{live?'LIVE DESK':'DESK ARCHIVE'}</Link>
}
