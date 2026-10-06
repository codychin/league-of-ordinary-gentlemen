import {createServerClient} from '@supabase/ssr';
import {NextResponse} from 'next/server';
import {authConfig} from './lib/manage-auth';
import {isStaging} from './lib/environment';

export async function proxy(request) {
  if(isStaging){
    const pathname=request.nextUrl.pathname;
    if(!['GET','HEAD','OPTIONS'].includes(request.method)||/^\/(manage|media-admin|editor|onboarding)(\/|$)/.test(pathname)||/^\/api\/(manage|oauth|push-release|send-hollis-push|media)(\/|$)/.test(pathname)){
      return NextResponse.json({error:'This action is disabled in staging. No live changes were made.'},{status:403,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
    }
    const response=NextResponse.next();
    response.headers.set('X-Robots-Tag','noindex, nofollow');
    response.headers.set('Content-Security-Policy',"connect-src 'self' https://cdn.syndication.twimg.com https://syndication.twitter.com https://platform.twitter.com; form-action 'self'; object-src 'none'; base-uri 'self'");
    return response;
  }
  if(!request.nextUrl.pathname.startsWith('/manage')&&!request.nextUrl.pathname.startsWith('/api/manage'))return NextResponse.next();
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

export const config = {matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']};
