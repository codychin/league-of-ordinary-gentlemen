export async function GET(){
  const upstream=await fetch('https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/hollis-body-score-push-once',{
    cache:'no-store',
    headers:{'x-hollis-trigger':'publish'}
  })
  const body=await upstream.text()
  return new Response(body,{status:upstream.status,headers:{'content-type':upstream.headers.get('content-type')||'application/json'}})
}
