'use client'
import {useEffect,useState} from 'react'
import {writers} from '../../articles/writers'

const API='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-live-desk'
const KEY='brief-editor-key'

export default function LiveEditor(){
  const [key,setKey]=useState('')
  const [queue,setQueue]=useState([])
  const [state,setState]=useState('Enter the editorial key to open the desk.')
  const load=async(value=key)=>{
    if(!value)return
    setState('Loading pitches…')
    const r=await fetch(API+'?action=queue',{headers:{'x-brief-media-key':value},cache:'no-store'})
    if(!r.ok){setState('Key not accepted.');return}
    const {posts=[]}=await r.json();setQueue(posts);setState(posts.length?`${posts.length} pitches awaiting review.`:'Desk clear. No pitches waiting.')
  }
  useEffect(()=>{const saved=window.localStorage.getItem(KEY)||'';setKey(saved);if(saved)load(saved)},[])
  const saveKey=()=>{window.localStorage.setItem(KEY,key);load(key)}
  const review=async(post,status)=>{
    setState(status==='live'?'Publishing…':'Updating…')
    const r=await fetch(API+'?action=review',{method:'PATCH',headers:{'Content-Type':'application/json','x-brief-media-key':key},body:JSON.stringify({...post,status})})
    if(!r.ok){setState('Update failed.');return}
    setQueue(items=>items.filter(item=>item.id!==post.id));setState(status==='live'?'Published to the Live Desk.':'Updated.')
  }
  const update=(id,field,value)=>setQueue(items=>items.map(item=>item.id===id?{...item,[field]:value}:item))
  return <main className="liveEditor">
    <header><small>THE BRIEF • PRIVATE</small><h1>Editor Desk</h1><p>Fast review for Sunday Live Desk pitches. Publish, hold, kill, or rewrite without leaving the queue.</p></header>
    <section className="editorKey"><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Editorial key"/><button onClick={saveKey}>OPEN DESK</button><span>{state}</span></section>
    <section className="editorQueue">{queue.map(post=>{const writer=writers[post.writer];return <article key={post.id} className="editorPitch">
      <div className="editorPitchHead"><img src={writer?.image} alt=""/><div><small>{writer?.name?.toUpperCase()} • {post.tag}</small><b>{post.subject||post.thread||'LIVE DESK PITCH'}</b></div></div>
      <input value={post.subject||''} onChange={e=>update(post.id,'subject',e.target.value)} placeholder="Subject / headline (optional)"/>
      <textarea value={post.text} onChange={e=>update(post.id,'text',e.target.value)} rows={5}/>
      <div className="editorMeta"><input value={post.tag||''} onChange={e=>update(post.id,'tag',e.target.value)} placeholder="Tag"/><input value={post.thread||''} onChange={e=>update(post.id,'thread',e.target.value)} placeholder="Thread / story"/></div>
      <textarea className="editorNote" value={post.editor_note||''} onChange={e=>update(post.id,'editor_note',e.target.value)} rows={2} placeholder="Editor note — why you're changing/killing this; this is the feedback signal."/>
      <div className="editorActions"><button className="publish" onClick={()=>review(post,'live')}>PUBLISH</button><button onClick={()=>review(post,'hold')}>HOLD</button><button className="kill" onClick={()=>review(post,'killed')}>KILL</button></div>
    </article>})}</section>
  </main>
}
