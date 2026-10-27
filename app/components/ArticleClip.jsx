'use client'

import {useEffect, useRef, useState} from 'react'

export default function ArticleClip({tweetId, url, caption, showCaption=true, videoSrc, videoPoster}) {
  const container = useRef(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (videoSrc) return
    let cancelled = false
    setLoaded(false)
    const host = container.current
    const render = () => {
      if (cancelled || !host || !window.twttr?.widgets) return
      host.replaceChildren()
      window.twttr.widgets.createTweet(tweetId, host, {
        conversation: 'none', align: 'center', dnt: true,
      }).then(widget => { if (!cancelled && widget) setLoaded(true) }).catch(() => {})
    }
    let script = document.getElementById('brief-x-widgets')
    if (window.twttr?.widgets) render()
    else {
      if (!script) {
        script = document.createElement('script')
        script.id = 'brief-x-widgets'
        script.src = 'https://platform.twitter.com/widgets.js'
        script.async = true
        document.body.appendChild(script)
      }
      script.addEventListener('load', render)
    }
    return () => { cancelled = true; script?.removeEventListener('load', render) }
  }, [tweetId, videoSrc])
  return <figure style={{margin:showCaption?'24px 0 28px':'24px 0 0',maxWidth:'100%'}}>
    {videoSrc?<video controls playsInline preload="metadata" src={videoSrc} poster={videoPoster} aria-label={caption||'Article video'} style={{display:'block',width:'100%',maxWidth:454,maxHeight:'70vh',height:'auto',objectFit:'contain',background:'#111',margin:'0 auto'}}/>:<div ref={container} style={{maxWidth:550,margin:'0 auto',overflow:'hidden'}}/>}
    {!videoSrc&&!loaded&&<blockquote style={{margin:0,padding:20,border:'1px solid var(--line)',fontSize:14,lineHeight:1.5}}><a href={url} target="_blank" rel="noopener noreferrer">Watch the original clip on X →</a></blockquote>}
    {showCaption&&<figcaption style={{fontSize:14,lineHeight:1.6,fontStyle:'italic',textAlign:'center'}}>
      {caption}<br/>
      <a href={url} target="_blank" rel="noopener noreferrer">Watch the clip on X</a>
    </figcaption>}
  </figure>
}
