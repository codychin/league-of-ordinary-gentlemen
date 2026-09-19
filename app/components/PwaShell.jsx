'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'
import {usePathname} from 'next/navigation'

const DISMISS_KEY='ordinary-brief-install-dismissed'

function MobileAppNav(){
  const pathname=usePathname()
  const [hash,setHash]=useState('')
  const tabFor=nextHash=>{
    if(pathname.startsWith('/teams')) return 'teams'
    if(pathname!=='/') return 'detail'
    if(nextHash==='#scores') return 'scores'
    if(nextHash==='#culture') return 'culture'
    return 'home'
  }

  const activate=nextHash=>{
    setHash(nextHash)
    document.documentElement.dataset.appTab=tabFor(nextHash)
  }

  useEffect(()=>{
    const scrollToLocation=()=>{
      const nextHash=window.location.hash
      activate(nextHash)
      window.requestAnimationFrame(()=>{
        if(!nextHash){
          window.scrollTo({top:0,behavior:'auto'})
          return
        }
        document.getElementById(nextHash.slice(1))?.scrollIntoView({behavior:'auto',block:'start'})
      })
    }
    scrollToLocation()
    window.addEventListener('hashchange',scrollToLocation)
    window.addEventListener('popstate',scrollToLocation)
    return()=>{
      window.removeEventListener('hashchange',scrollToLocation)
      window.removeEventListener('popstate',scrollToLocation)
    }
  },[pathname])

  const items=[
    {href:'/',label:'Home',active:pathname==='/'&&!hash},
    {href:'/#scores',label:'Scores',hash:'#scores',active:pathname==='/'&&hash==='#scores'},
    {href:'/teams',label:'Teams',active:pathname.startsWith('/teams')},
    {href:'/#culture',label:'Culture',hash:'#culture',active:pathname==='/'&&hash==='#culture'},
  ]

  const navigate=(event,item)=>{
    if(item.href==='/teams'){
      event.preventDefault()
      if(pathname.startsWith('/teams')) window.scrollTo({top:0,behavior:'auto'})
      else window.location.assign('/teams')
      return
    }

    if(pathname!=='/'){
      if(item.href.startsWith('/#')||item.href==='/'){
        event.preventDefault()
        window.location.assign(item.href)
      }
      return
    }

    event.preventDefault()
    if(!item.hash){
      if(window.location.hash) window.history.pushState(null,'','/')
      window.scrollTo({top:0,behavior:'auto'})
      activate('')
      return
    }

    if(window.location.hash!==item.hash) window.history.pushState(null,'',item.hash)
    activate(item.hash)
    document.getElementById(item.hash.slice(1))?.scrollIntoView({behavior:'auto',block:'start'})
  }

  return <nav className="appTabBar" aria-label="App navigation">
    {items.map((item,index)=><Link
      key={item.label}
      href={item.href}
      className={item.active?'active':''}
      aria-current={item.active?'page':undefined}
      onClick={event=>navigate(event,item)}
    ><span>0{index+1}</span>{item.label}</Link>)}
  </nav>
}

function InstallPrompt(){
  const [installEvent,setInstallEvent]=useState(null)
  const [show,setShow]=useState(false)
  const [expanded,setExpanded]=useState(false)
  const [isIOS,setIsIOS]=useState(false)
  const [isSafari,setIsSafari]=useState(false)

  useEffect(()=>{
    const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true
    const mobile=window.matchMedia('(max-width: 760px)').matches
    const ios=/iphone|ipad|ipod/i.test(window.navigator.userAgent)
    const safari=/safari/i.test(window.navigator.userAgent)&&!/crios|fxios|edgios/i.test(window.navigator.userAgent)
    setIsIOS(ios)
    setIsSafari(safari)

    const dismissed=window.localStorage.getItem(DISMISS_KEY)==='true'
    if(!standalone&&mobile&&!dismissed&&ios) setShow(true)

    const captureInstall=(event)=>{
      event.preventDefault()
      setInstallEvent(event)
      if(!dismissed&&mobile) setShow(true)
    }
    window.addEventListener('beforeinstallprompt',captureInstall)
    return()=>window.removeEventListener('beforeinstallprompt',captureInstall)
  },[])

  const dismiss=()=>{
    window.localStorage.setItem(DISMISS_KEY,'true')
    setShow(false)
  }

  const install=async()=>{
    if(installEvent){
      await installEvent.prompt()
      const choice=await installEvent.userChoice
      if(choice.outcome==='accepted') setShow(false)
      setInstallEvent(null)
      return
    }
    setExpanded(value=>!value)
  }

  if(!show) return null

  return <aside className="installPrompt" aria-label="Install The Brief">
    <button className="installDismiss" type="button" onClick={dismiss} aria-label="Dismiss install message">×</button>
    <div className="installMark">OB</div>
    <div className="installCopy">
      <b>Put The Brief on your home screen.</b>
      <span>Open it like an app. No bookmark retrieval operation required.</span>
      {expanded&&<small>{isIOS
        ? isSafari?'Tap the Share button, then choose Add to Home Screen.':'Open ordinarybrief.com in Safari, tap Share, then Add to Home Screen.'
        :'Open your browser menu and choose Install app or Add to Home screen.'}</small>}
    </div>
    <button className="installAction" type="button" onClick={install}>{installEvent?'INSTALL':'HOW'}</button>
  </aside>
}

export default function PwaShell(){
  useEffect(()=>{
    if(process.env.NODE_ENV==='production'&&'serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{})
    }
  },[])

  return <><InstallPrompt/><MobileAppNav/></>
}
