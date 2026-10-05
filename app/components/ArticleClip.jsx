'use client'

import {useEffect, useRef} from 'react'

export default function ArticleClip({tweetId, url, caption, showCaption=true}) {
  const container = useRef(null)
  useEffect(() => {
    let cancelled = false
    const host = container.current
    const render = () => {
      if (cancelled || !host || !window.twttr?.widgets) return
      host.replaceChildren()
      window.twttr.widgets.createTweet(tweetId, host, {
        conversation: 'none', align: 'center', dnt: true,
      }).catch(() => {})
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
  }, [tweetId])
  return <figure style={{margin:showCaption?'24px 0 28px':'24px 0 0',maxWidth:'100%'}}>
    <div ref={container} style={{maxWidth:550,margin:'0 auto',overflow:'hidden'}}/>
    {showCaption&&<figcaption style={{fontSize:14,lineHeight:1.6,fontStyle:'italic',textAlign:'center'}}>
      {caption}<br/>
      <a href={url} target="_blank" rel="noopener noreferrer">Watch the clip on X</a>
    </figcaption>}
  </figure>
}
