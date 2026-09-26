export const runtime='edge';

export async function GET(request,{params}){
  const {id}=await params;
  if(!/^[a-f0-9]{32}$/i.test(id)) return new Response('Not found',{status:404});

  const source=new URL(`/reels/${id}.mp4`,request.url);
  const range=request.headers.get('range');
  const headers={};
  if(range) headers.Range=range;

  const upstream=await fetch(source,{headers,cache:'no-store'});
  if(!upstream.ok&&upstream.status!==206) return new Response('Upstream unavailable',{status:upstream.status||502});

  const out=new Headers();
  for(const key of ['content-type','content-length','content-range','accept-ranges','etag','last-modified']){
    const value=upstream.headers.get(key);
    if(value) out.set(key,value);
  }
  out.set('Content-Type','video/mp4');
  out.set('Accept-Ranges','bytes');
  out.set('Cache-Control','public, max-age=3600, stale-while-revalidate=86400');

  return new Response(upstream.body,{status:upstream.status,headers:out});
}
