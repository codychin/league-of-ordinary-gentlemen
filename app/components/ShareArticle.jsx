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

export default function ShareArticle({slug,title,dek}){
  const [status,setStatus]=useState('')

  const share=async()=>{
    const url=`${window.location.origin}/articles/${slug}`
    try{
      if(navigator.share){
        await navigator.share({title,text:dek,url})
        setStatus('SHARED')
      }else{
        await fallbackCopy(url)
        setStatus('LINK COPIED')
      }
    }catch(error){
      if(error?.name==='AbortError') return
      try{
        await fallbackCopy(url)
        setStatus('LINK COPIED')
      }catch{
        setStatus('COPY FAILED')
      }
    }
    window.setTimeout(()=>setStatus(''),1800)
  }

  return <div className="articleShareRow">
    <button type="button" className="articleShare" onClick={share} aria-label="Share this article">
      <span aria-hidden="true">↗</span> SHARE ARTICLE
    </button>
    {status&&<small className="articleShareStatus" role="status">{status}</small>}
  </div>
}
