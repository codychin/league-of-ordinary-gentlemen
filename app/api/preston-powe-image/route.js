const SOURCE='https://ontexasfootball.com/uploads/monthly_2026_01/IMG_9519.thumb.jpeg.30642cb8db54d622fdf270f2b1b78888.jpeg'

export const runtime='nodejs'
export const revalidate=604800

export async function GET(){
  try{
    const upstream=await fetch(SOURCE,{headers:{'user-agent':'Mozilla/5.0','referer':'https://ontexasfootball.com/'},next:{revalidate:604800}})
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
