'use client'

import Link from 'next/link'
import {useEffect, useRef, useState} from 'react'
import {usePathname, useRouter} from 'next/navigation'

const DISMISS_KEY='ordinary-brief-install-dismissed'
const NOTIFICATION_SEEN_KEY='ordinary-brief-last-notification'
const APP_TAB_KEY='ordinary-brief-active-tab'
const PUSH_API='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-push'

function urlBase64ToUint8Array(value){
  const padding='='.repeat((4-value.length%4)%4)
  const base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/')
  const raw=window.atob(base64)
  return Uint8Array.from([...raw].map(character=>character.charCodeAt(0)))
}

function BellIcon(){
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>
}

function ArticleAlertSettings(){
  const [state,setState]=useState('loading')
  const [message,setMessage]=useState('Checking this device…')
  const showDetail=['install','unsupported','denied','error'].includes(state)

  useEffect(()=>{
    let active=true
    const check=async()=>{
      const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true
      if(!standalone){if(active){setState('install');setMessage('Install The Brief to receive iPhone alerts.')}return}
      if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){if(active){setState('unsupported');setMessage('Article alerts are not supported on this device.')}return}
      if(Notification.permission==='denied'){if(active){setState('denied');setMessage('Notifications are blocked in your device settings.')}return}
      try{
        const registration=await navigator.serviceWorker.ready
        const subscription=await registration.pushManager.getSubscription()
        if(active){setState(subscription?'subscribed':'available');setMessage(subscription?'Homepage story alerts are on.':'Get alerts for stories featured on the main page.')}
      }catch{
        if(active){setState('error');setMessage('Article alerts could not be checked.')}
      }
    }
    check()
    return()=>{active=false}
  },[])

  const enable=async()=>{
    setState('working')
    setMessage('Turning on homepage alerts…')
    try{
      const permission=await Notification.requestPermission()
      if(permission!=='granted'){
        setState(permission==='denied'?'denied':'available')
        setMessage(permission==='denied'?'Notifications are blocked in your device settings.':'Permission was not granted.')
        return
      }
      const registration=await navigator.serviceWorker.ready
      const keyResponse=await fetch(`${PUSH_API}?action=key`,{cache:'no-store'})
      if(!keyResponse.ok) throw new Error('Public key unavailable')
      const {publicKey}=await keyResponse.json()
      const subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(publicKey)})
      const saveResponse=await fetch(`${PUSH_API}?action=subscribe`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(subscription)})
      if(!saveResponse.ok){await subscription.unsubscribe();throw new Error('Subscription could not be saved')}
      setState('subscribed')
      setMessage('Homepage story alerts are on.')
    }catch{
      setState('error')
      setMessage('Could not turn on alerts. Please try again.')
    }
  }

  const disable=async()=>{
    setState('working')
    setMessage('Turning off homepage alerts…')
    try{
      const registration=await navigator.serviceWorker.ready
      const subscription=await registration.pushManager.getSubscription()
      if(subscription){
        await fetch(`${PUSH_API}?action=subscribe`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:subscription.endpoint})})
        await subscription.unsubscribe()
      }
      if('clearAppBadge' in navigator) await navigator.clearAppBadge()
      setState('available')
      setMessage('Get alerts for stories featured on the main page.')
    }catch{
      setState('error')
      setMessage('Could not update alerts. Please try again.')
    }
  }

  return <div className="notificationSetting" aria-live="polite">
    <div><b>Enable notifications</b>{showDetail&&<p>{message}</p>}</div>
    {state==='subscribed'
      ?<button type="button" onClick={disable} aria-label="Turn off notifications" role="switch" aria-checked="true"><span/></button>
      :<button type="button" onClick={enable} aria-label="Turn on notifications" role="switch" aria-checked="false" aria-busy={state==='working'} disabled={!['available','error'].includes(state)}><span/></button>}
  </div>
}

function NotificationCenter(){
  const [open,setOpen]=useState(false)
  const [notifications,setNotifications]=useState([])
  const [loading,setLoading]=useState(true)
  const [unread,setUnread]=useState(false)

  useEffect(()=>{
    let active=true
    const load=()=>fetch(`${PUSH_API}?action=notifications`,{cache:'no-store'})
        .then(response=>response.ok?response.json():Promise.reject())
        .then(({notifications:items=[]})=>{
          if(!active)return
          setNotifications(items)
          setUnread(Boolean(items[0]?.sent_at&&items[0].sent_at!==window.localStorage.getItem(NOTIFICATION_SEEN_KEY)))
        })
        .catch(()=>{})
        .finally(()=>{if(active)setLoading(false)})
    const onMessage=event=>{if(event.data?.type==='article-push')load()}
    load()
    navigator.serviceWorker?.addEventListener('message',onMessage)
    return()=>{
      active=false
      navigator.serviceWorker?.removeEventListener('message',onMessage)
    }
  },[])

  const toggle=()=>{
    const next=!open
    setOpen(next)
    if(next&&notifications[0]?.sent_at){
      window.localStorage.setItem(NOTIFICATION_SEEN_KEY,notifications[0].sent_at)
      setUnread(false)
      if('clearAppBadge' in navigator) navigator.clearAppBadge().catch(()=>{})
    }
  }

  return <div className={`articleAlerts ${open?'open':''}`}>
    <button className="articleAlertBell" type="button" onClick={toggle} aria-label="Notifications" aria-expanded={open}><BellIcon/>{unread&&<span className="unread"/>}</button>
    {open&&<aside className="articleAlertPanel" aria-live="polite">
      <div className="notificationPanelHead"><small>THE BRIEF • NOTIFICATIONS</small><b>Latest bulletins</b></div>
      <div className="notificationList">{loading
        ?<p>Checking the wire…</p>
        :notifications.length?notifications.map(item=><Link key={item.article_id} href={item.url} onClick={()=>setOpen(false)}><b>{item.title}</b><span>{item.body}</span></Link>)
        :<p>No bulletins yet. A rare moment of institutional restraint.</p>}
      </div>
    </aside>}
  </div>
}

function TabIcon({name}){
  const paths={
    Home:<><path d="M4 7.5 12 3l8 4.5v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M8 11h8M8 14h8M8 17h5"/></>,
    Scores:<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h3v3H7zM14 9h3M14 12h3M7 16h10"/></>,
    Teams:<><path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.8 10a2.4 2.4 0 1 0 0-4.8"/><path d="M3 19c.4-3.6 2.2-5.4 5.5-5.4S13.6 15.4 14 19M14.5 13.2c3.7-.2 5.8 1.7 6 5.8"/></>,
    Culture:<><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/><path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z"/></>,
    More:<><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></>,
  }
  return <span className="appTabIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg></span>
}

function MoreMenuIcon({name}){
  const paths={
    Archive:<><path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3zM9 11h6"/></>,
    Staff:<><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3.5 20c.3-4.2 2.2-6.2 5.5-6.2s5.2 2 5.5 6.2M15 14.2c3.4-.2 5.2 1.7 5.5 5.8"/></>,
    Corrections:<><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12l2 2 4-4M9 18h6"/></>,
  }
  return <span className="appMoreIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg></span>
}

function MobileAppNav(){
  const pathname=usePathname()
  const router=useRouter()
  const [activeTab,setActiveTab]=useState(pathname.startsWith('/teams')?'teams':pathname.startsWith('/matchups')?'scores':pathname==='/'?'home':'detail')
  const [moreOpen,setMoreOpen]=useState(false)
  const tabFor=nextHash=>{
    if(pathname.startsWith('/teams')) return 'teams'
    if(pathname.startsWith('/matchups')) return 'scores'
    if(pathname!=='/') return document.querySelector('[data-app-section="culture"]')?'culture':'detail'
    if(nextHash==='#scores') return 'scores'
    if(nextHash==='#culture') return 'culture'
    return 'home'
  }

  const activate=nextHash=>{
    const nextTab=tabFor(nextHash)
    setActiveTab(nextTab)
    document.documentElement.dataset.appTab=nextTab
  }

  const setVisualTab=nextTab=>{
    setActiveTab(nextTab)
  }

  const resetAppScroll=()=>{
    const doReset=()=>window.scrollTo({top:0,left:0,behavior:'auto'})
    doReset()
    window.requestAnimationFrame(()=>window.requestAnimationFrame(doReset))
    window.setTimeout(doReset,80)
  }

  useEffect(()=>{
    router.prefetch('/')
    router.prefetch('/teams')
    setMoreOpen(false)
    const preview=new URLSearchParams(window.location.search).get('app-preview')==='1'
    const standalone=preview||window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true
    document.documentElement.classList.toggle('standaloneApp',standalone)
    document.documentElement.classList.toggle('appPreview',preview)
    const priorRestoration='scrollRestoration' in window.history?window.history.scrollRestoration:null
    if(standalone&&'scrollRestoration' in window.history) window.history.scrollRestoration='manual'
    const scrollToLocation=()=>{
      const nextHash=window.location.hash
      if(standalone){
        let nextTab
        if(pathname.startsWith('/teams')) nextTab='teams'
        else if(pathname.startsWith('/matchups')) nextTab='scores'
        else if(pathname!=='/') nextTab=document.querySelector('[data-app-section="culture"]')?'culture':'detail'
        else if(nextHash==='#scores') nextTab='scores'
        else if(nextHash==='#culture') nextTab='culture'
        else nextTab=window.sessionStorage.getItem(APP_TAB_KEY)||'home'
        if(!['home','scores','culture','teams','detail'].includes(nextTab)) nextTab='home'
        setActiveTab(nextTab)
        document.documentElement.dataset.appTab=nextTab
        if(pathname==='/'&&['home','scores','culture'].includes(nextTab)) window.sessionStorage.setItem(APP_TAB_KEY,nextTab)
        if(nextHash){
          const clean=window.location.pathname+window.location.search
          window.history.replaceState(null,'',clean)
        }
        resetAppScroll()
        return
      }
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
      if(priorRestoration!==null&&'scrollRestoration' in window.history) window.history.scrollRestoration=priorRestoration
    }
  },[pathname])

  const items=[
    {href:'/',label:'Home',tab:'home',active:activeTab==='home'||activeTab==='detail'},
    {href:'/#scores',label:'Scores',tab:'scores',hash:'#scores',active:activeTab==='scores'},
    {href:'/teams',label:'Teams',tab:'teams',active:activeTab==='teams'},
    {href:'/#culture',label:'Culture',tab:'culture',hash:'#culture',active:activeTab==='culture'},
  ]

  const primeTab=item=>{
    setMoreOpen(false)
    setActiveTab(item.tab)
    document.documentElement.dataset.appTab=item.tab
  }

  const navigate=(event,item)=>{
    setMoreOpen(false)
    setVisualTab(item.tab)
    if(item.href==='/teams'){
      event.preventDefault()
      if(pathname.startsWith('/teams')) resetAppScroll()
      else router.push('/teams')
      return
    }

    if(pathname!=='/'){
      if(item.href.startsWith('/#')||item.href==='/'){
        event.preventDefault()
        const standalone=document.documentElement.classList.contains('standaloneApp')
        if(standalone){
          window.sessionStorage.setItem(APP_TAB_KEY,item.tab)
          const query=document.documentElement.classList.contains('appPreview')?'?app-preview=1':''
          router.push('/'+query)
        }else{
          router.push(item.href)
        }
      }
      return
    }

    event.preventDefault()
    const standalone=document.documentElement.classList.contains('standaloneApp')
    if(standalone){
      window.sessionStorage.setItem(APP_TAB_KEY,item.tab)
      const clean=window.location.pathname+window.location.search
      if(window.location.hash) window.history.replaceState(null,'',clean)
      setActiveTab(item.tab)
      document.documentElement.dataset.appTab=item.tab
      resetAppScroll()
      return
    }

    if(!item.hash){
      if(window.location.hash) window.history.pushState(null,'','/')
      activate('')
      resetAppScroll()
      return
    }

    if(window.location.hash!==item.hash) window.history.pushState(null,'',item.hash)
    activate(item.hash)
    document.getElementById(item.hash.slice(1))?.scrollIntoView({behavior:'auto',block:'start'})
  }

  const headerLabel=moreOpen?'More':pathname.startsWith('/matchups')?'Matchup':activeTab==='scores'?'Scores':activeTab==='teams'?'Teams':activeTab==='culture'?'Tha Culture':activeTab==='detail'?'The Brief':''
  return <>
    <div className="appSectionHeader" aria-hidden="true"><span>{headerLabel}</span></div>
    {moreOpen&&<aside className="appMoreSheet" aria-label="More and settings">
      <div className="appMoreHead"><small>THE BRIEF</small><b>More</b><button type="button" onClick={()=>setMoreOpen(false)} aria-label="Close more menu">×</button></div>
      <div className="appSettings"><small>SETTINGS</small><ArticleAlertSettings/></div>
      <div className="appMoreLinks">
        <Link href="/archive"><MoreMenuIcon name="Archive"/><span>Archive</span></Link>
        <Link href="/staff"><MoreMenuIcon name="Staff"/><span>Staff</span></Link>
        <Link href="/corrections"><MoreMenuIcon name="Corrections"/><span>Corrections</span></Link>
      </div>
    </aside>}
    <nav className="appTabBar" data-active-tab={moreOpen?'more':activeTab==='detail'?'home':activeTab} aria-label="App navigation">
      <span className="appTabGlider" aria-hidden="true"/>
      {items.map(item=><Link
      key={item.label}
      href={item.href}
      className={item.active?'active':''}
      aria-current={item.active?'page':undefined}
      aria-label={item.label}
      onPointerDown={()=>primeTab(item)}
      onTouchStart={()=>primeTab(item)}
      onClick={event=>navigate(event,item)}
      ><TabIcon name={item.label}/><span className="appTabLabel">{item.label}</span></Link>)}
      <button className={moreOpen?'active':''} type="button" aria-label="More" aria-expanded={moreOpen} onPointerDown={()=>{setActiveTab('more');document.documentElement.dataset.appTab='more'}} onClick={()=>setMoreOpen(value=>!value)}><TabIcon name="More"/><span className="appTabLabel">More</span></button>
    </nav>
  </>
}

function PullToRefresh(){
  const indicatorRef=useRef(null)
  const router=useRouter()

  useEffect(()=>{
    const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true
    if(!standalone) return

    const indicator=indicatorRef.current
    let startY=0
    let distance=0
    let tracking=false
    const threshold=64

    const reset=()=>{
      tracking=false
      distance=0
      indicator.style.setProperty('--pull-distance','0px')
      indicator.classList.remove('visible','ready','refreshing')
    }
    const start=event=>{
      if(window.scrollY>0||event.touches.length!==1||(event.target instanceof Element&&event.target.closest('input,textarea,select,button'))) return
      startY=event.touches[0].clientY
      tracking=true
    }
    const move=event=>{
      if(!tracking) return
      const delta=event.touches[0].clientY-startY
      if(delta<=0){reset();return}
      event.preventDefault()
      distance=Math.min(92,delta*.52)
      indicator.style.setProperty('--pull-distance',`${distance}px`)
      indicator.classList.add('visible')
      indicator.classList.toggle('ready',distance>=threshold)
    }
    const end=()=>{
      if(!tracking) return
      tracking=false
      if(distance<threshold){reset();return}
      indicator.classList.remove('ready')
      indicator.classList.add('refreshing')
      indicator.style.setProperty('--pull-distance','46px')
      window.setTimeout(()=>{
        router.refresh()
        window.setTimeout(reset,520)
      },180)
    }

    document.addEventListener('touchstart',start,{passive:true})
    document.addEventListener('touchmove',move,{passive:false})
    document.addEventListener('touchend',end,{passive:true})
    document.addEventListener('touchcancel',reset,{passive:true})
    return()=>{
      document.removeEventListener('touchstart',start)
      document.removeEventListener('touchmove',move)
      document.removeEventListener('touchend',end)
      document.removeEventListener('touchcancel',reset)
    }
  },[])

  return <div className="pullRefresh" ref={indicatorRef} aria-hidden="true"><span/><b/></div>
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

  return <aside className={`installPrompt ${expanded?'expanded':''}`} aria-label="Download the Ordinary Brief app">
    <button className="installDismiss" type="button" onClick={dismiss} aria-label="Dismiss app download message">×</button>
    <div className="installMark">OB</div>
    <div className="installCopy">
      <b>Download the Ordinary Brief app</b>
      <span>Faster access, push alerts, and journalism without purpose — now with an icon.</span>
      {expanded&&<div className="installSteps">{isIOS
        ? isSafari
          ? <><span><i>1</i>Tap the <strong>Share</strong> button in Safari.</span><span><i>2</i>Choose <strong>Add to Home Screen</strong>.</span><span><i>3</i>Tap <strong>Add</strong>. The Brief will appear with your apps.</span></>
          : <><span><i>1</i>Open <strong>ordinarybrief.com</strong> in Safari.</span><span><i>2</i>Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</span><span><i>3</i>Tap <strong>Add</strong>. You're in.</span></>
        : <span>Use your browser's <strong>Install app</strong> option to add The Brief.</span>}</div>}
    </div>
    <button className="installAction" type="button" onClick={install}>{installEvent?'DOWNLOAD APP':expanded?'CLOSE':'DOWNLOAD APP'}</button>
  </aside>
}

export default function PwaShell(){
  useEffect(()=>{
    if(process.env.NODE_ENV==='production'&&'serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{})
    }
  },[])

  return <><PullToRefresh/><InstallPrompt/><NotificationCenter/><MobileAppNav/></>
}
