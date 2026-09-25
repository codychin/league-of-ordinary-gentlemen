const ARTICLE='https://www.mysanantonio.com/sports/article/ut-fan-big-red-apple-tv-brothers-22427383.php'

export const runtime='nodejs'
export const dynamic='force-dynamic'

export async function GET(){
  try{
    const page=await fetch(ARTICLE,{headers:{'user-agent':'Mozilla/5.0'},next:{revalidate:604800}})
    if(!page.ok) return new Response('Image unavailable',{status:502})
    const html=await page.text()
    const match=html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)
    if(!match) return new Response('Image unavailable',{status:502})
    const upstream=await fetch(match[1],{headers:{'user-agent':'Mozilla/5.0'},next:{revalidate:604800}})
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
