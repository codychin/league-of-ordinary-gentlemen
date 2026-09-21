const SOURCE='https://commons.wikimedia.org/wiki/Special:Redirect/file/NFL%20on%20Regent%20Street%2C%20London%2C%20cropped.jpg'

export const runtime='nodejs'
export const dynamic='force-dynamic'

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
