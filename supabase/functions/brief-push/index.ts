import webpush from 'npm:web-push@3.6.7'
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'content-type,x-brief-media-key',
  'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS',
}

const allowedPushHost=(hostname:string)=>
  hostname==='fcm.googleapis.com'||
  hostname.endsWith('.push.apple.com')||
  hostname==='updates.push.services.mozilla.com'||
  hostname.endsWith('.notify.windows.com')

const response=(body:unknown,status=200)=>Response.json(body,{status,headers:cors})

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors})

  const db=createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const action=new URL(req.url).searchParams.get('action')||'key'

  try{
    if(req.method==='GET'&&action==='key'){
      const {data,error}=await db.from('brief_push_config').select('public_key').eq('id',1).single()
      if(error) throw error
      return response({publicKey:data.public_key})
    }

    const body=await req.json()

    if(req.method==='POST'&&action==='subscribe'){
      const endpoint=String(body?.endpoint||'')
      const p256dh=String(body?.keys?.p256dh||'')
      const auth=String(body?.keys?.auth||'')
      const endpointUrl=new URL(endpoint)
      if(endpointUrl.protocol!=='https:'||!allowedPushHost(endpointUrl.hostname)) return response({error:'Unsupported push service'},400)
      if(endpoint.length>2048||p256dh.length<20||p256dh.length>512||auth.length<8||auth.length>256) return response({error:'Invalid subscription'},400)

      const {error}=await db.from('brief_push_subscriptions').upsert({
        endpoint,
        p256dh,
        auth,
        user_agent:String(req.headers.get('user-agent')||'').slice(0,300),
        updated_at:new Date().toISOString(),
      },{onConflict:'endpoint'})
      if(error) throw error
      return response({ok:true})
    }

    if(req.method==='DELETE'&&action==='subscribe'){
      const endpoint=String(body?.endpoint||'')
      if(endpoint){
        const {error}=await db.from('brief_push_subscriptions').delete().eq('endpoint',endpoint)
        if(error) throw error
      }
      return response({ok:true})
    }

    if(req.method==='POST'&&action==='send'){
      const expected=Deno.env.get('BRIEF_MEDIA_UPLOAD_KEY')
      if(!expected||req.headers.get('x-brief-media-key')!==expected) return response({error:'Unauthorized'},401)

      const articleId=String(body?.articleId||'').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,120)
      const title=String(body?.title||'').trim().slice(0,120)
      const message=String(body?.body||'').trim().slice(0,240)
      if(!articleId||!title||!message) return response({error:'Article ID, title and body are required'},400)

      const {data:prior}=await db.from('brief_push_deliveries').select('article_id').eq('article_id',articleId).maybeSingle()
      if(prior) return response({error:'An alert was already sent for this article'},409)

      const [{data:config,error:configError},{data:subscriptions,error:subscriptionsError}]=await Promise.all([
        db.from('brief_push_config').select('public_key,private_key,subject').eq('id',1).single(),
        db.from('brief_push_subscriptions').select('endpoint,p256dh,auth'),
      ])
      if(configError) throw configError
      if(subscriptionsError) throw subscriptionsError

      webpush.setVapidDetails(config.subject,config.public_key,config.private_key)
      const url=`/articles/${articleId}`
      const payload=JSON.stringify({
        title,
        body:message,
        url,
        tag:`article-${articleId}`,
        icon:'/icons/ordinary-brief-v2-192.png',
        badge:'/icons/ordinary-brief-32.png',
      })
      const results=await Promise.allSettled((subscriptions||[]).map(subscription=>
        webpush.sendNotification({
          endpoint:subscription.endpoint,
          keys:{p256dh:subscription.p256dh,auth:subscription.auth},
        },payload,{TTL:86400,urgency:'normal',topic:articleId.slice(0,32)})
      ))

      const expired:string[]=[]
      let sent=0
      let failed=0
      results.forEach((result,index)=>{
        if(result.status==='fulfilled') sent+=1
        else{
          failed+=1
          const statusCode=(result.reason as {statusCode?:number})?.statusCode
          if(statusCode===404||statusCode===410) expired.push(subscriptions![index].endpoint)
        }
      })
      if(expired.length) await db.from('brief_push_subscriptions').delete().in('endpoint',expired)

      const {error:deliveryError}=await db.from('brief_push_deliveries').insert({
        article_id:articleId,
        title,
        body:message,
        url,
        sent_count:sent,
        failed_count:failed,
      })
      if(deliveryError) throw deliveryError
      return response({ok:true,sent,failed,expired:expired.length})
    }

    return response({error:'Not found'},404)
  }catch(error){
    return response({error:String((error as Error)?.message||error)},400)
  }
})
