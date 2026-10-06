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
  const requestUrl=new URL(req.url)
  const action=requestUrl.searchParams.get('action')||'key'
  const edition=requestUrl.searchParams.get('edition')||'league-of-ordinary-gentlemen'
  const roots:Record<string,string>={'league-of-ordinary-gentlemen':'','sunday-crew':'/sunday-crew',doge:'/doge'}
  if(!Object.hasOwn(roots,edition))return response({error:'Unknown edition'},400)
  const root=roots[edition]

  try{
    if(req.method==='GET'&&action==='key'){
      const {data,error}=await db.from('brief_push_config').select('public_key').eq('id',1).single()
      if(error) throw error
      return response({publicKey:data.public_key})
    }

    if(req.method==='GET'&&action==='notifications'){
      const {data,error}=await db
        .from('brief_push_deliveries')
        .select('article_id,title,body,url,sent_at').eq('edition_slug',edition)
        .order('sent_at',{ascending:false})
        .limit(12)
      if(error) throw error
      return response({notifications:data||[]})
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
        edition_slug:edition,
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
        const {error}=await db.from('brief_push_subscriptions').delete().eq('endpoint',endpoint).eq('edition_slug',edition)
        if(error) throw error
      }
      return response({ok:true})
    }

    if(req.method==='POST'&&action==='test-self'){
      const endpoint=String(body?.endpoint||'')
      const p256dh=String(body?.keys?.p256dh||'')
      const auth=String(body?.keys?.auth||'')
      const endpointUrl=new URL(endpoint)
      if(endpointUrl.protocol!=='https:'||!allowedPushHost(endpointUrl.hostname)) return response({error:'Unsupported push service'},400)
      if(endpoint.length>2048||p256dh.length<20||p256dh.length>512||auth.length<8||auth.length>256) return response({error:'Invalid subscription'},400)

      const {data:config,error:configError}=await db.from('brief_push_config').select('public_key,private_key,subject').eq('id',1).single()
      if(configError) throw configError
      webpush.setVapidDetails(config.subject,config.public_key,config.private_key)

      const payload=JSON.stringify({
        title:'The Brief is on assignment.',
        body:'Six matchups. Six correspondents. Video dispatches from around the league are live now.',
        url:(root||'/')+'?tab=home',
        tag:'reels-week3-test',
        icon:'/icons/ordinary-brief-v3-192.png',
        badge:'/icons/ordinary-brief-32.png',
        image:'https://www.ordinarybrief.com/images/staff/sabine-march.webp',
      })

      await webpush.sendNotification({
        endpoint,
        keys:{p256dh,auth},
      },payload,{TTL:3600,urgency:'high',topic:'reels-week3-test'})
      return response({ok:true})
    }

    if(req.method==='POST'&&action==='send'){
      const expected=Deno.env.get('BRIEF_MEDIA_UPLOAD_KEY')
      if(!expected||req.headers.get('x-brief-media-key')!==expected) return response({error:'Unauthorized'},401)

      const articleId=String(body?.articleId||'').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,120)
      const title=String(body?.title||'').trim().slice(0,120)
      const message=String(body?.body||'').trim().slice(0,240)
      const imageValue=String(body?.image||'').trim().slice(0,2048)
      if(!articleId||!title||!message) return response({error:'Article ID, title and body are required'},400)
      if(body?.homepage!==true) return response({error:'Push alerts are reserved for stories featured on the main page'},400)
      if(!imageValue) return response({error:'A verified article image is required before sending a push'},400)
      if(imageValue.startsWith('data:')) return response({error:'Inline data images are not allowed for push alerts; publish the image at a real HTTPS URL first'},400)

      const imageUrl=new URL(imageValue,'https://www.ordinarybrief.com')
      if(imageUrl.protocol!=='https:') return response({error:'The notification image must use HTTPS'},400)
      const image=imageUrl.href
      const url=root+'/articles/'+articleId
      const deliveryId=root?edition+'-'+articleId:articleId
      const articleUrl='https://www.ordinarybrief.com'+url

      const [homepageResponse,articleResponse,imageResponse]=await Promise.all([
        fetch('https://www.ordinarybrief.com'+(root||'/'),{cache:'no-store',headers:{'User-Agent':'The-Brief-Push-Desk/1.1'}}),
        fetch(articleUrl,{cache:'no-store',headers:{'User-Agent':'The-Brief-Push-Desk/1.1'}}),
        fetch(image,{cache:'no-store',headers:{'User-Agent':'The-Brief-Push-Desk/1.1'}}),
      ])
      if(!homepageResponse.ok) return response({error:'The production homepage could not be verified'},502)
      if(!articleResponse.ok) return response({error:'The production article route is not live'},409)
      if(!imageResponse.ok) return response({error:'The production article image is not reachable'},409)

      const imageType=(imageResponse.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
      if(!['image/jpeg','image/png'].includes(imageType)) return response({error:'Rich push images must resolve as JPEG or PNG'},409)
      const imageLength=Number(imageResponse.headers.get('content-length')||0)
      if(imageLength&&imageLength<1024) return response({error:'The production rich push image is unexpectedly small'},409)

      const [homepage,articleHtml]=await Promise.all([homepageResponse.text(),articleResponse.text()])
      if(!homepage.includes('href="'+url+'"')) return response({error:'This story is not currently featured on the production homepage'},409)
      const imagePath=imageUrl.origin==='https://www.ordinarybrief.com'?imageUrl.pathname:image
      if(!articleHtml.includes(imagePath)&&!articleHtml.includes(image)) return response({error:'The production article does not reference the verified image yet'},409)
      if(articleHtml.includes('data:image')) return response({error:'The production article still contains an inline image; publish and verify a real image asset before pushing'},409)

      const [{data:config,error:configError},{data:subscriptions,error:subscriptionsError}]=await Promise.all([
        db.from('brief_push_config').select('public_key,private_key,subject').eq('id',1).single(),
        db.from('brief_push_subscriptions').select('endpoint,p256dh,auth').eq('edition_slug',edition),
      ])
      if(configError) throw configError
      if(subscriptionsError) throw subscriptionsError

      const {error:claimError}=await db.from('brief_push_deliveries').insert({
        article_id:deliveryId,
        edition_slug:edition,
        title,
        body:message,
        url,
        sent_count:0,
        failed_count:0,
      })
      if(claimError?.code==='23505') return response({error:'An alert was already sent for this article'},409)
      if(claimError) throw claimError

      webpush.setVapidDetails(config.subject,config.public_key,config.private_key)
      const payload=JSON.stringify({
        title,
        body:message,
        url,
        tag:'article-'+articleId,
        icon:'/icons/ordinary-brief-v3-192.png',
        badge:'/icons/ordinary-brief-32.png',
        image,
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

      const {error:deliveryError}=await db.from('brief_push_deliveries').update({
        sent_count:sent,
        failed_count:failed,
      }).eq('article_id',deliveryId)
      if(deliveryError) throw deliveryError
      return response({ok:true,sent,failed,expired:expired.length,preflight:'passed'})
    }

    return response({error:'Not found'},404)
  }catch(error){
    return response({error:String((error as Error)?.message||error)},400)
  }
})
