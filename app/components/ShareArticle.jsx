'use client'

import {useEffect, useId, useRef, useState} from 'react'

const copyText=async text=>{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return}
  const node=document.createElement('textarea')
  node.value=text
  node.setAttribute('readonly','')
  node.style.position='fixed'
  node.style.opacity='0'
  document.body.appendChild(node)
  try{node.select();if(!document.execCommand('copy'))throw new Error('Copy unavailable')}
  finally{node.remove()}
}

export default function ShareArticle({slug,title}){
  const [ready,setReady]=useState(false)
  const [status,setStatus]=useState('')
  const [sharing,setSharing]=useState(false)
  const [url,setUrl]=useState('')
  const [open,setOpen]=useState(false)
  const panel=useRef(null),trigger=useRef(null),id=useId()
  useEffect(()=>setReady(true),[])
  useEffect(()=>{if(open)panel.current?.querySelector('button')?.focus()},[open])
  const close=()=>{setOpen(false);trigger.current?.focus()}
  const share=async()=>{
    if(sharing)return
    const link=window.location.origin+(window.location.pathname.includes('/articles/')?window.location.pathname:`/articles/${slug}`)
    setUrl(link);setStatus('');setSharing(true)
    try{
      if(navigator.share){await navigator.share({url:link,title});setStatus('Shared')}
      else setOpen(true)
    }catch(error){if(error?.name!=='AbortError')setOpen(true)}
    finally{setSharing(false)}
  }
  const copy=async()=>{
    try{await copyText(url);setStatus('Link copied')}
    catch{setStatus('Copy unavailable. Select the link below.')}
  }
  return <div className="articleShareRow" onKeyDown={event=>{if(event.key==='Escape'&&open){event.preventDefault();close()}}}>
    <button ref={trigger} type="button" className="articleShare" onClick={share}
      disabled={!ready||sharing} aria-label="Share this article" aria-busy={sharing} aria-expanded={open} aria-controls={id}>
      <svg className="articleShareIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m-4.5 4.5L12 3l4.5 4.5M5 11v8h14v-8"/></svg>
      <span>Share</span>
    </button>
    {!open&&<small className="articleShareAnnouncement" role="status" aria-live="polite">{status}</small>}
    {open&&<div ref={panel} id={id} className="articleShareOptions" role="group" aria-label="Share options">
      <small className={status.startsWith("Copy unavailable")?"articleShareFeedback":"articleShareAnnouncement"} role="status" aria-live="polite">{status}</small>
      <button type="button" onClick={copy}>Copy link</button>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
      <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title||'')}`} target="_blank" rel="noopener noreferrer">X</a>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title||''} ${url}`.trim())}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a href={`mailto:?subject=${encodeURIComponent(title||'The Brief')}&body=${encodeURIComponent(url)}`}>Email</a>
      <input aria-label="Article link" readOnly value={url} onFocus={event=>event.target.select()}/>
      <button type="button" onClick={close}>Close</button>
    </div>}
  </div>
}
