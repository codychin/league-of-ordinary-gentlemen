export async function GET(){
  const upstream=await fetch('https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/maude-route22-push-once',{
    cache:'no-store',
    headers:{'x-maude-trigger':'publish'}
  })
  const body=await upstream.text()
  return new Response(body,{status:upstream.status,headers:{'content-type':upstream.headers.get('content-type')||'application/json'}})
}
