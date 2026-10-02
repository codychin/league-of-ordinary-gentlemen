import baseManifest from '../../manifest';

export function GET() {
  const manifest = {...baseManifest(), id: '/sunday-crew', name: 'Sunday Crew — The Brief', short_name: 'Sunday Crew', description: 'Sunday Crew scores, matchups and newsroom.', start_url: '/sunday-crew?tab=home', scope: '/sunday-crew', shortcuts: [{name: 'Home', url: '/sunday-crew?tab=home'}, {name: 'Scores', url: '/sunday-crew?tab=scores'}, {name: 'Teams', url: '/sunday-crew/teams'}]};
  return Response.json(manifest, {headers: {'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300'}});
}
