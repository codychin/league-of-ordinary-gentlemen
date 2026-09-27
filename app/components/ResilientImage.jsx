'use client'

import {useState} from 'react'

const withRetryToken=(src,attempt)=>{
  if(!attempt||!src||src.startsWith('data:')) return src
  const join=src.includes('?')?'&':'?'
  return `${src}${join}brief_retry=${attempt}`
}

export default function ResilientImage({src,alt='',className='',...props}){
  const [attempt,setAttempt]=useState(0)
  const [failed,setFailed]=useState(false)
  const onError=()=>{
    if(attempt<2){
      setAttempt(n=>n+1)
      return
    }
    setFailed(true)
    try{
      console.warn('[Brief image failure]',{src,path:window.location.pathname})
    }catch{}
  }
  if(failed) return <div className={`${className} resilientImageFallback`} role="img" aria-label={alt}><span>THE BRIEF</span></div>
  return <img {...props} className={className} src={withRetryToken(src,attempt)} alt={alt} onError={onError}/>
}
