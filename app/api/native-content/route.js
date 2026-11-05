import snapshot from '../../../lib/generated/native-feed.json';
// This is a complete public snapshot. No account, league, draft or user data.
export const dynamic = 'force-static';
export function GET() {
  return Response.json(snapshot, {headers:{
    'Cache-Control':'public, max-age=0, must-revalidate',
    'CDN-Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    ETag:`"${snapshot.revision}"`,
  }});
}
