const VERSION='ordinary-brief-v22'
const STATIC_CACHE=`${VERSION}-static`
// Stable across app releases; content-addressed image URLs invalidate themselves.
const IMAGE_CACHE='brief-public-images-v1'
const IMAGE_LIMIT=180
const IMAGE_MAX_AGE=7*24*60*60*1000
const inflight=new Map()
async function fetchImage(request){
  if(inflight.has(request.url))return (await inflight.get(request.url)).clone()
  const job=(async()=>{
    const response=await fetch(request)
    if(response.ok&&response.headers.get('content-type')?.startsWith('image/')){
      try{
        const cache=await caches.open(IMAGE_CACHE)
        const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');headers.set('x-brief-cached-at',String(Date.now()))
        await cache.put(request,new Response(await response.clone().blob(),{status:response.status,headers}))
        const keys=await cache.keys();await Promise.all(keys.slice(0,Math.max(0,keys.length-IMAGE_LIMIT)).map(key=>cache.delete(key)))
      }catch{} // Cache pressure must never prevent an image displaying.
    }
    return response
  })()
  inflight.set(request.url,job)
  try{return (await job).clone()}finally{inflight.delete(request.url)}
}
const PAGE_CACHE=`${VERSION}-pages`
const PRECACHE=[
  '/offline',
  '/icons/ordinary-brief-v3-192.png',
  '/icons/ordinary-brief-v3-512.png',
  '/icons/apple-touch-icon-v3.png',
]

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()))
})

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('ordinary-brief-')&&!key.startsWith(VERSION)).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  )
})

self.addEventListener('fetch',event=>{
  const {request}=event
  if(request.method!=='GET') return

  const url=new URL(request.url)
  if(url.pathname.startsWith('/publishing-pilot')||url.pathname.startsWith('/api/publishing-pilot')) return
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/manage')) return

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          if(response.ok){const copy=response.clone();event.waitUntil(caches.open(PAGE_CACHE).then(cache=>cache.put(request,copy)))}
          return response
        })
        .catch(async()=>await caches.match(request)||await caches.match('/offline'))
    )
    return
  }

  if(request.destination==='video'||url.pathname.startsWith('/reels/')) return

  // Content-hashed Next assets are immutable. Reuse them instantly offline/online.
  // Keep RSC responses and non-hashed scripts out of the page cache.
  if(['style','script'].includes(request.destination)&&url.pathname.startsWith('/_next/static/')){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.put(request,copy)))}
      return response
    })))
    return
  }

  if(request.destination==='image'){
    // API/live data and cross-origin resources have already been excluded above.
    const result=(async()=>{
      let cached
      try{cached=await (await caches.open(IMAGE_CACHE)).match(request)}catch{}
      const immutable=/^\/images\/cache\/[a-f0-9]+-\d+\.webp$/.test(url.pathname)
      const age=cached?Date.now()-Number(cached.headers.get('x-brief-cached-at')||0):Infinity
      if(cached&&(immutable||age<IMAGE_MAX_AGE))return cached
      if(cached){event.waitUntil(fetchImage(request).catch(()=>{}));return cached}
      return fetchImage(request)
    })()
    event.respondWith(result)
    event.waitUntil(result.then(()=>{},()=>{}))
    return
  }
  if(request.destination==='font'){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok)event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.put(request,response.clone())).catch(()=>{}))
      return response
    })))
  }
})

self.addEventListener('push',event=>{
  let payload={}
  try{payload=event.data?.json()||{}}catch{payload={body:event.data?.text()||''}}
  const title=payload.title||'The Brief of Ordinary Gentleman'
  event.waitUntil(Promise.all([
    self.registration.showNotification(title,{
      body:payload.body||'A new article has been published.',
      icon:payload.icon||'/icons/ordinary-brief-v3-192.png',
      badge:payload.badge||'/icons/ordinary-brief-32.png',
      ...(payload.image?{image:payload.image}:{}),
      tag:payload.tag||'ordinary-brief-article',
      data:{url:payload.url||'/'},
    }),
    self.navigator?.setAppBadge?.(1),
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(windows=>windows.forEach(client=>client.postMessage({type:'article-push'}))),
  ]))
})

self.addEventListener('notificationclick',event=>{
  event.notification.close()
  const target=new URL(event.notification.data?.url||'/',self.location.origin).href
  event.waitUntil((async()=>{
    await self.navigator?.clearAppBadge?.()
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true})
    const existing=windows.find(client=>client.url===target)||windows[0]
    if(existing){await existing.navigate(target);return existing.focus()}
    return self.clients.openWindow(target)
  })())
})
