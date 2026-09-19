const VERSION='ordinary-brief-v3'
const STATIC_CACHE=`${VERSION}-static`
const PAGE_CACHE=`${VERSION}-pages`
const PRECACHE=[
  '/offline',
  '/icons/ordinary-brief-v2-192.png',
  '/icons/ordinary-brief-v2-512.png',
  '/icons/apple-touch-icon-v2.png',
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
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')) return

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          if(response.ok) caches.open(PAGE_CACHE).then(cache=>cache.put(request,response.clone()))
          return response
        })
        .catch(async()=>await caches.match(request)||await caches.match('/offline'))
    )
    return
  }

  if(['style','script','font','image'].includes(request.destination)){
    event.respondWith(
      caches.match(request).then(cached=>{
        const fresh=fetch(request).then(response=>{
          if(response.ok) caches.open(STATIC_CACHE).then(cache=>cache.put(request,response.clone()))
          return response
        }).catch(()=>cached)
        return cached||fresh
      })
    )
  }
})

self.addEventListener('push',event=>{
  let payload={}
  try{payload=event.data?.json()||{}}catch{payload={body:event.data?.text()||''}}
  const title=payload.title||'The Brief of Ordinary Gentleman'
  event.waitUntil(Promise.all([
    self.registration.showNotification(title,{
      body:payload.body||'A new article has been published.',
      icon:payload.icon||'/icons/ordinary-brief-v2-192.png',
      badge:payload.badge||'/icons/ordinary-brief-32.png',
      tag:payload.tag||'ordinary-brief-article',
      data:{url:payload.url||'/'},
    }),
    self.navigator?.setAppBadge?.(1),
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
