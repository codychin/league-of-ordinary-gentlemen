export const dynamic='force-dynamic'
export async function GET(){
  const upstream=await fetch('https://www.ordinarybrief.com/api/push-release',{
    method:'POST',
    headers:{'content-type':'application/json'},
    cache:'no-store',
  })
  const body=await upstream.text()
  return new Response(body,{status:upstream.status,headers:{'content-type':upstream.headers.get('content-type')||'application/json'}})
}
