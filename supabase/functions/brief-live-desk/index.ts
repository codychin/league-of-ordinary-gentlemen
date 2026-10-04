import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'content-type,x-brief-media-key',
  'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS',
}
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:cors})

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const url=new URL(req.url)
  const action=url.searchParams.get('action')||'live'
  const expected=Deno.env.get('BRIEF_MEDIA_UPLOAD_KEY')
  const isEditor=Boolean(expected&&req.headers.get('x-brief-media-key')===expected)
  try{
    if(req.method==='GET'&&action==='live'){
      const edition=url.searchParams.get('edition')
      if(edition){
        if(edition!=='sunday-crew') return response({error:'Unknown edition'},404)
        const {data,error}=await db.from('brief_edition_live_posts').select('id,writer,tag,text,subject,thread,published_at,sort_time,source_url,source_name').eq('edition_slug',edition).eq('status','live').order('sort_time',{ascending:false}).limit(100)
        if(error) throw error
        return response({edition,posts:data||[]})
      }
      const {data,error}=await db.from('brief_live_desk_posts').select('id,writer,tag,text,subject,thread,published_at,sort_time,source_url,source_name').eq('status','live').order('sort_time',{ascending:false}).limit(100)
      if(error) throw error
      return response({posts:data||[]})
    }
    if(req.method==='GET'&&action==='queue'){
      if(!isEditor) return response({error:'Unauthorized'},401)
      const {data,error}=await db.from('brief_live_desk_posts').select('*').in('status',['draft','hold']).order('sort_time',{ascending:false}).limit(100)
      if(error) throw error
      return response({posts:data||[]})
    }
    if(req.method==='POST'&&action==='draft'){
      if(!isEditor) return response({error:'Unauthorized'},401)
      const body=await req.json()
      const writer=String(body.writer||'')
      const tag=String(body.tag||'DESK NOTE').trim().slice(0,40)
      const text=String(body.text||'').trim().slice(0,1200)
      const subject=String(body.subject||'').trim().slice(0,120)||null
      const thread=String(body.thread||'').trim().slice(0,120)||null
      if(!text) return response({error:'Text required'},400)
      const {data,error}=await db.from('brief_live_desk_posts').insert({writer,tag,text,subject,thread,status:'draft'}).select().single()
      if(error) throw error
      return response({post:data})
    }
    if(req.method==='PATCH'&&action==='review'){
      if(!isEditor) return response({error:'Unauthorized'},401)
      const body=await req.json()
      const id=Number(body.id)
      const status=String(body.status||'')
      if(!id||!['draft','hold','live','killed'].includes(status)) return response({error:'Invalid review'},400)
      const patch:any={status,updated_at:new Date().toISOString()}
      if(typeof body.text==='string') patch.text=body.text.trim().slice(0,1200)
      if(typeof body.tag==='string') patch.tag=body.tag.trim().slice(0,40)
      if(typeof body.subject==='string') patch.subject=body.subject.trim().slice(0,120)||null
      if(typeof body.thread==='string') patch.thread=body.thread.trim().slice(0,120)||null
      if(typeof body.editor_note==='string') patch.editor_note=body.editor_note.trim().slice(0,500)||null
      if(status==='live') patch.published_at=new Date().toISOString()
      const {data,error}=await db.from('brief_live_desk_posts').update(patch).eq('id',id).select().single()
      if(error) throw error
      return response({post:data})
    }
    return response({error:'Not found'},404)
  }catch(error){return response({error:String((error as Error)?.message||error)},400)}
})
