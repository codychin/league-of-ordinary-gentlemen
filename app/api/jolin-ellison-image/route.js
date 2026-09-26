const SOURCE='https://images2.minutemediacdn.com/image/upload/c_crop%2Cx_0%2Cy_122%2Cw_2400%2Ch_1350/c_fill%2Cw_720%2Car_16%3A9%2Cf_auto%2Cq_auto%2Cg_auto/images/ImagnImages/mmsport/the_athlete_lifestyle_on_si/01jdr344hprcxjfynev6.jpg'

export const runtime='nodejs'
export const revalidate=604800

export async function GET(){
  try{
    const upstream=await fetch(SOURCE,{headers:{'user-agent':'Mozilla/5.0'},next:{revalidate:604800}})
    if(!upstream.ok) return new Response('Image unavailable',{status:502})
    const body=await upstream.arrayBuffer()
    return new Response(body,{headers:{
      'content-type':upstream.headers.get('content-type')||'image/jpeg',
      'content-length':String(body.byteLength),
      'cache-control':'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000'
    }})
  }catch{
    return new Response('Image unavailable',{status:502})
  }
}
