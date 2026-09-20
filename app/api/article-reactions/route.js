const SUPABASE_URL='https://dnzdbqycuuoonewcowis.supabase.co'
const SUPABASE_KEY='sb_publishable_oVFeqnL1WtrpB5BWZopBSw_rKScXieO'

const headers={
  apikey:SUPABASE_KEY,
  Authorization:`Bearer ${SUPABASE_KEY}`,
}

const emptyCounts=()=>({up:0,wtf:0,middle:0})

export async function GET(request){
  const {searchParams}=new URL(request.url)
  const slug=searchParams.get('slug')
  if(!slug) return Response.json({error:'Missing article slug'},{status:400})

  const res=await fetch(`${SUPABASE_URL}/rest/v1/article_reactions?article_slug=eq.${encodeURIComponent(slug)}&select=reaction`,{
    headers,
    cache:'no-store',
  })
  if(!res.ok) return Response.json({error:'Could not load reactions'},{status:502})

  const rows=await res.json()
  const counts=emptyCounts()
  for(const row of rows) if(Object.hasOwn(counts,row.reaction)) counts[row.reaction]++
  return Response.json({counts})
}

export async function POST(request){
  let body
  try{body=await request.json()}catch{return Response.json({error:'Invalid request'},{status:400})}

  const {slug,reaction,sessionId}=body||{}
  if(typeof slug!=='string'||!slug||slug.length>160) return Response.json({error:'Invalid article slug'},{status:400})
  if(!['up','wtf','middle'].includes(reaction)) return Response.json({error:'Invalid reaction'},{status:400})
  if(typeof sessionId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)){
    return Response.json({error:'Invalid session'},{status:400})
  }

  const res=await fetch(`${SUPABASE_URL}/rest/v1/article_reactions?on_conflict=article_slug,session_id`,{
    method:'POST',
    headers:{
      ...headers,
      'Content-Type':'application/json',
      Prefer:'resolution=merge-duplicates,return=minimal',
    },
    body:JSON.stringify([{
      article_slug:slug,
      reaction,
      session_id:sessionId,
      updated_at:new Date().toISOString(),
    }]),
  })

  if(!res.ok) return Response.json({error:'Could not save reaction'},{status:502})
  return Response.json({ok:true})
}
