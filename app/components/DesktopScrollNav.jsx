'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'

// Fixed overlay (not in page flow) prevents layout jumps. Desktop only via CSS.
export default function DesktopScrollNav({root='',edition=false}){
  const [visible,setVisible]=useState(false)
  useEffect(()=>{
    const update=()=>setVisible(window.scrollY>240)
    update()
    window.addEventListener('scroll',update,{passive:true})
    return()=>window.removeEventListener('scroll',update)
  },[])
  const base=root||''
  return <nav aria-label="Compact desktop navigation" aria-hidden={!visible} className={'briefScrollNav'+(visible?' isVisible':'')}>
    <Link className="briefScrollNavBrand" href={base||'/'} tabIndex={visible?0:-1}>THE BRIEF</Link>
    <div className="briefScrollNavLinks">
      <Link href={base||'/'} tabIndex={visible?0:-1}>HOME</Link>
      <Link href={base+'/#league'} tabIndex={visible?0:-1}>THE LEAGUE</Link>
      <Link href={base+'/teams'} tabIndex={visible?0:-1}>FRANCHISES</Link>
      <Link href={base+'/#culture'} tabIndex={visible?0:-1}>CULTURE</Link>
      <Link href={base+'/#scores'} tabIndex={visible?0:-1}>SCORES</Link>
      <Link href={base+'/archive'} tabIndex={visible?0:-1}>ARCHIVE</Link>
      <Link href={edition?base+'/newsroom':'/staff'} tabIndex={visible?0:-1}>MASTHEAD</Link>
    </div>
  </nav>
}
