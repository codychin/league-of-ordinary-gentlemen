'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {writers} from '../articles/writers'
const API='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-live-desk'
function safeSource(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}}
export default function LiveDeskArchive({editionSlug='',title='The Brief'}){
  const root=editionSlug?'/'+editionSlug:''
  const [day,setDay]=useState(''),[cursors,setCursors]=useState([null]),[page,setPage]=useState(0)
  const [result,setResult]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true)
  const cursor=cursors[page]
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');setResult(null)
    const params=new URLSearchParams({action:'archive'})
    if(editionSlug)params.set('edition',editionSlug)
    if(day)params.set('date',day)
    if(cursor)params.set('cursor',cursor)
    fetch(API+'?'+params,{cache:'no-store',signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||'Archive unavailable');return data}).then(data=>{setResult(data);setLoading(false)}).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setLoading(false)}})
    return()=>controller.abort()
  },[editionSlug,day,cursor])
  return <><header className="articleHeader"><Link className="miniMast" href={root||'/'}>{title}</Link><nav className="siteNav"><Link href={root||'/'}>HOME</Link><Link href={root+'/archive'}>ARTICLES</Link><Link href={root+'/#scores'}>SCORES</Link></nav></header>
    <main><section className="directoryHead"><div className="eyebrow">THE PERMANENT RECORD</div><h1>Sunday Desk Archive</h1><p>Published desk notes, preserved by Sunday. All dates and times are Eastern. This is an archive, not a live feed.</p>
      <label>Sunday date <input aria-label="Sunday date" type="date" value={day||result?.date||''} onChange={e=>{setDay(e.target.value);setCursors([null]);setPage(0)}}/></label>
    </section><section className="archiveWrap" aria-live="polite">
      {loading&&<p>Loading published notes…</p>}{error&&<p role="alert">{error}. Choose a Sunday or try again later.</p>}
      {result&&!loading&&<><p>{result.date} · {result.edition==='loog'?'LOOG':result.edition} edition · Page {page+1}</p>
      {!result.posts.length&&<p>No published desk notes for this Sunday.</p>}
      {result.posts.map(post=>{const author=writers[post.writer];const source=safeSource(post.source_url);return <article className="archiveStory" key={post.id}><div><small>{author?.name||post.writer} · {post.tag}</small><p style={{whiteSpace:'pre-wrap'}}>{post.text}</p><time dateTime={post.published_at}>{new Date(post.published_at).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET</time>{source&&<p><a href={source} target="_blank" rel="noopener noreferrer">{post.source_name||'Source'} ↗</a></p>}</div></article>})}
      <nav aria-label="Archive pages"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Newer notes</button>{' '}<button disabled={!result.nextCursor} onClick={()=>{setDay(result.date);setCursors(c=>[...c.slice(0,page+1),result.nextCursor]);setPage(p=>p+1)}}>Older notes</button></nav></>}
    </section></main></>
}
