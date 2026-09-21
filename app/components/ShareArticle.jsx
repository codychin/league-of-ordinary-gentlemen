'use client'

import {useState} from 'react'

const fallbackCopy=async text=>{
  if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(text)
    return
  }
  const node=document.createElement('textarea')
  node.value=text
  node.setAttribute('readonly','')
  node.style.position='fixed'
  node.style.opacity='0'
  document.body.appendChild(node)
  node.select()
  document.execCommand('copy')
  node.remove()
}

function ShareIcon(){
  return <svg className="articleShareIcon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 15V3"/>
    <path d="m7.5 7.5 4.5-4.5 4.5 4.5"/>
    <path d="M5 11v8h14v-8"/>
  </svg>
}

export default function ShareArticle({slug,title,dek}){
  const [status,setStatus]=useState('')
  const [sharing,setSharing]=useState(false)

  const share=async()=>{
    if(sharing) return
    const url=`${window.location.origin}/articles/${slug}`
    setSharing(true)
    try{
      if(navigator.share){
        await navigator.share({title,text:dek,url})
        setStatus('SHARED')
      }else{
        await fallbackCopy(url)
        setStatus('LINK COPIED')
      }
    }catch(error){
      if(error?.name==='AbortError'){
        setSharing(false)
        return
      }
      try{
        await fallbackCopy(url)
        setStatus('LINK COPIED')
      }catch{
        setStatus('COPY FAILED')
      }
    }finally{
      setSharing(false)
    }
    window.setTimeout(()=>setStatus(''),1800)
  }

  return <div className="articleShareRow">
    <button
      type="button"
      className="articleShare"
      onClick={share}
      aria-label="Share this article"
      aria-busy={sharing}
    >
      <span className="articleShareMark"><ShareIcon/></span>
      <span className="articleShareLabel">SHARE ARTICLE</span>
    </button>
    <small className="articleShareStatus" role="status" aria-live="polite">{status}</small>
  </div>
}
