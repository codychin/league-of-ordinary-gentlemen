import {isStaging} from '../../../lib/environment';
import baseManifest from '../../manifest';

export function GET() {
  const manifest = {...baseManifest(), id: '/doge', name: isStaging?'STAGING — DOGE4':'DOGE4 — The Brief', short_name: isStaging?'QA DOGE4':'DOGE4', description: 'DOGE4 scores, matchups and newsroom.', start_url: '/doge?tab=home', scope: '/doge', shortcuts: [{name: 'Home', url: '/doge?tab=home'}, {name: 'Scores', url: '/doge?tab=scores'}, {name: 'Teams', url: '/doge/teams'}]};
  return Response.json(manifest, {headers: {'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300'}});
}
