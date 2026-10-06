import {isStaging} from '../../../lib/environment';
import baseManifest from '../../manifest';

export function GET() {
  const manifest = {...baseManifest(), id: '/sunday-crew', name: isStaging?'STAGING — Sunday Crew':'Sunday Crew — The Brief', short_name: isStaging?'QA Sunday Crew':'Sunday Crew', description: 'Sunday Crew scores, matchups and newsroom.', start_url: '/sunday-crew?tab=home', scope: '/sunday-crew', shortcuts: [{name: 'Home', url: '/sunday-crew?tab=home'}, {name: 'Scores', url: '/sunday-crew?tab=scores'}, {name: 'Teams', url: '/sunday-crew/teams'}]};
  return Response.json(manifest, {headers: {'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300'}});
}
