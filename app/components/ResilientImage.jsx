'use client'

import {useEffect,useRef,useState} from 'react'
import {imageAsset,imageSrc,imageSrcSet} from '../../lib/editorial-images'

export default function ResilientImage({src,alt='',className='',style,sizes='(max-width: 600px) 100vw, 800px',loading='lazy',onLoad,onError,...props}){
  // Keying the inner image resets failure/loading state before a changed source paints.
  return <ImageContent key={src} {...{src,alt,className,style,sizes,loading,onLoad,onError}} {...props}/>
}
function ImageContent({src,alt,className,style,sizes,loading,onLoad,onError,...props}){
  const ref=useRef(null)
  const [loaded,setLoaded]=useState(false)
  const [fallback,setFallback]=useState(false)
  const [failed,setFailed]=useState(false)
  const asset=imageAsset(src)
  const resolved=fallback?src:imageSrc(src)
  useEffect(()=>{
    const img=ref.current
    if(img?.complete&&img.naturalWidth)setLoaded(true)
    if(loading==='eager'||!img)return
    // Promote visible images immediately after a tab becomes visible; leave the rest lazy.
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)){img.loading='eager';observer.disconnect()}
    },{rootMargin:'180px'})
    observer.observe(img)
    return()=>observer.disconnect()
  },[loading])
  const fail=event=>{
    if(asset&&!fallback){setFallback(true);return}
    setFailed(true);onError?.(event)
  }
  if(failed)return <div className={`${className} resilientImageFallback`} style={style} role="img" aria-label={alt}><span>THE BRIEF</span></div>
  return <img ref={ref} className={className} {...props} width={props.width??asset?.width} height={props.height??asset?.height} loading={loading} decoding="async" src={resolved} srcSet={fallback?undefined:imageSrcSet(src)} sizes={sizes} alt={alt} data-brief-image="true" data-loaded={loaded?'true':'false'} style={{backgroundColor:'#e6e1d7',...(!loaded&&asset?.blur?{backgroundImage:`url("${asset.blur}")`,backgroundSize:'cover',backgroundPosition:style?.objectPosition||'center'}:{}),...style}} onLoad={event=>{setLoaded(true);onLoad?.(event)}} onError={fail}/>
}
