'use client'

import {useEffect,useState} from 'react'

const options=[
  {key:'up',icon:'👍',label:'GOOD'},
  {key:'wtf',icon:'🤷',label:'WTF'},
  {key:'middle',icon:'🖕',label:'NOPE'},
]

const getSession=()=>{
  const key='ordinary-brief-feedback-session'
  let value=window.localStorage.getItem(key)
  if(!value){
    value=crypto.randomUUID()
    window.localStorage.setItem(key,value)
  }
  return value
}

export default function ArticleReactions({slug}){
  const [counts,setCounts]=useState({up:0,wtf:0,middle:0})
  const [selected,setSelected]=useState(null)
  const [saving,setSaving]=useState(false)

  useEffect(()=>{
    setSelected(window.localStorage.getItem(`ordinary-brief-reaction:${slug}`))
    fetch(`/api/article-reactions?slug=${encodeURIComponent(slug)}`,{cache:'no-store'})
      .then(r=>r.ok?r.json():null)
      .then(data=>{if(data?.counts)setCounts(data.counts)})
      .catch(()=>{})
  },[slug])

  const react=async reaction=>{
    if(saving) return
    const previous=selected
    setSaving(true)
    setSelected(reaction)
    setCounts(current=>{
      const next={...current}
      if(previous&&previous!==reaction) next[previous]=Math.max(0,(next[previous]||0)-1)
      if(previous!==reaction) next[reaction]=(next[reaction]||0)+1
      return next
    })
    window.localStorage.setItem(`ordinary-brief-reaction:${slug}`,reaction)

    try{
      const res=await fetch('/api/article-reactions',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({slug,reaction,sessionId:getSession()}),
      })
      if(!res.ok) throw new Error('save failed')
    }catch{
      setSelected(previous)
      window.localStorage[previous?'setItem':'removeItem'](`ordinary-brief-reaction:${slug}`,previous||'')
      setCounts(current=>{
        const next={...current}
        if(previous!==reaction) next[reaction]=Math.max(0,(next[reaction]||0)-1)
        if(previous&&previous!==reaction) next[previous]=(next[previous]||0)+1
        return next
      })
    }finally{
      setSaving(false)
    }
  }

  return <aside className="articleReactions" aria-label="React to this article">
    <div className="reactionIntro">
      <small>READER FEEDBACK</small>
      <b>How’d we do?</b>
      <span>One tap. Editorial damage is permanent.</span>
    </div>
    <div className="reactionButtons">
      {options.map(option=><button
        type="button"
        key={option.key}
        className={selected===option.key?'selected':''}
        aria-pressed={selected===option.key}
        aria-label={option.label}
        onClick={()=>react(option.key)}
        disabled={saving}
      >
        <span className="reactionIcon" aria-hidden="true">{option.icon}</span>
        <b>{option.label}</b>
        <small>{counts[option.key]||0}</small>
      </button>)}
    </div>
  </aside>
}
