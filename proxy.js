import {createServerClient} from '@supabase/ssr';
import {NextResponse} from 'next/server';
import {authConfig} from './lib/manage-auth';

export async function proxy(request) {
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

export const config = {matcher: ['/manage/:path*', '/api/manage/:path*']};
