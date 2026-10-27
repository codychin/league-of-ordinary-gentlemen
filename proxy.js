import {createServerClient} from '@supabase/ssr';
import {NextResponse} from 'next/server';
import {authConfig} from './lib/manage-auth';
import {sessionClient,confirmedSession} from './lib/publishing-pilot/session.mjs';

export async function proxy(request) {
  if(request.nextUrl.pathname.startsWith('/publishing-pilot/')||request.nextUrl.pathname.startsWith('/api/publishing-pilot')){
    // Bootstrap must work without a prior cookie. It validates origin and session itself.
    if(request.nextUrl.pathname==='/api/publishing-pilot/session')return NextResponse.next();
    let response=NextResponse.next({request});
    try{
      const db=sessionClient({getAll:()=>request.cookies.getAll(),setAll:values=>{
        values.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }});
      await confirmedSession(db);
    }catch{
      // Renderer/API retain their unavailable/recoverable response contracts.
      response=NextResponse.next({request});
    }
    response.headers.set('Cache-Control','private, no-store');
    response.headers.set('Referrer-Policy','no-referrer');
    response.headers.set('X-Robots-Tag','noindex, nofollow');
    return response;
  }
  let response = NextResponse.next({request});
  const {url, key} = authConfig();
  const db = createServerClient(url, key, {cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: values => {
      values.forEach(({name, value}) => request.cookies.set(name, value));
      response = NextResponse.next({request});
      values.forEach(({name, value, options}) => response.cookies.set(name, value, options));
    },
  }});
  await db.auth.getUser();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {matcher: ['/manage/:path*', '/api/manage/:path*', '/publishing-pilot/:path*', '/api/publishing-pilot/:path*']};
