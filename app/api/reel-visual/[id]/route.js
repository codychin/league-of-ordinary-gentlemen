export const runtime='edge';

const ALLOWED=new Set([
  '392481b81c933a1c16c0681d80094e25',
  'cd532bffc3dce227f11f04663439e4d9',
  'e3c3146fd8882061f97aadb30cd1c551',
  'aaa2bdbd267cdf52f10bf4332c20c24d',
  'ca91cf52b9bfd5ea053d97c8f660cdcb',
  '65a14e3f3970c6406712a99e31827fd6'
]);

export async function GET(request,{params}){
  const {id}=await params;
  if(!ALLOWED.has(id)) return new Response('Not found',{status:404});
  const upstream=await fetch(`https://resource2.heygen.ai/video/${id}/gif.gif`,{cache:'no-store'});
  if(!upstream.ok) return new Response('Upstream unavailable',{status:502});
  return new Response(upstream.body,{
    status:200,
    headers:{
      'Content-Type':upstream.headers.get('content-type')||'image/gif',
      'Cache-Control':'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin':'*'
    }
  });
}
