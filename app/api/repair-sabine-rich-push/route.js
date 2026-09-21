export const dynamic='force-dynamic'
export async function GET(){
  const key=process.env.BRIEF_MEDIA_UPLOAD_KEY
  if(!key) return Response.json({error:'Push delivery is not configured'},{status:503})
  const r=await fetch('https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/sabine-rich-push-repair',{
    method:'POST',
    headers:{'x-brief-media-key':key},
    cache:'no-store',
  })
  return new Response(await r.text(),{status:r.status,headers:{'content-type':r.headers.get('content-type')||'application/json'}})
}
