const SOURCE='https://s.yimg.com/ny/api/res/1.2/03JJNvZ3csQhU0MktFNg1w--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTY2MjtjZj13ZWJw/https%3A/media.zenfs.com/en/new_england_patriots_wire_usa_today_sports_articles_330/f2034ddb14412bf1943591586d544711'

export const runtime='nodejs'
export const revalidate=604800

export async function GET(){
  try{
    const upstream=await fetch(SOURCE,{next:{revalidate:604800}})
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
