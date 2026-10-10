import { NextResponse } from 'next/server';
export const dynamic='force-dynamic';
export function GET(){
 const sha=process.env.VERCEL_GIT_COMMIT_SHA||process.env.GIT_COMMIT_SHA||'unknown';
 return NextResponse.json({status:'ok',commit:sha,environment:process.env.VERCEL_ENV||'unknown'},{headers:{'Cache-Control':'no-store, max-age=0'}});
}
