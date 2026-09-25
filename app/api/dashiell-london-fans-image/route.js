const SOURCE='https://res-2.cloudinary.com/blog-storage/image/upload/q_auto/v1/ghost/o5rnhd42gikglunexgml.jpg?_a=BAMAOGfi0'

export const runtime='nodejs'
export const dynamic='force-dynamic'

export async function GET(){
  try{
    const upstream=await fetch(SOURCE,{headers:{'user-agent':'Mozilla/5.0','accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'},next:{revalidate:604800}})
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
