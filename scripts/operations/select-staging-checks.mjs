// An opt-in independent-change lane, not a media filename denylist.
// Shared runtime, arbitrary app code, manifests, assets, dependencies, tests and
// this classifier itself are deliberately full. Thus unknown transitive inputs
// cannot accidentally bypass real media preparation.
import {readFileSync, appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const independentPaths = new Set([
  'app/sitemap.js',
  'app/robots.js',
  'lib/public-sitemap.mjs',
  'app/components/SiteNav.js',
  'app/components/EditionSiteNav.js',
  'app/components/useCompactMobileNav.js',
  'app/reader-navigation.css',
  'README.md',
]);

export function selectStagingChecks({event, changes, complete = true}) {
  const full = reason => ({media: 'required', reason});
  if (event !== 'pull_request') return full('Production and manual runs retain full validation');
  if (!complete || !Array.isArray(changes) || !changes.length) return full('No complete change set');
  for (const change of changes) {
    if (!change || !['A','M'].includes(change.status)) return full('Deletion, rename or unsupported status');
    if (!independentPaths.has(change.path)) return full('Unclassified or potentially shared input');
  }
  return {media: 'not-required', reason: 'Only explicitly independent navigation, discovery or documentation inputs changed'};
}

export function parseNameStatus(input) {
  // Git -z prevents quoted filenames, whitespace, tabs or newlines from being
  // misread as another allowed path. Renames are expanded to D+A upstream.
  if (!input || !input.endsWith('\0')) throw Error('Incomplete git diff');
  const fields = input.slice(0,-1).split('\0');
  if (fields.length % 2) throw Error('Malformed git diff');
  return Array.from({length:fields.length/2},(_,i)=>({status:fields[i*2],path:fields[i*2+1]}));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let changes = [], complete = false;
  try { changes = parseNameStatus(readFileSync(process.argv[2], 'utf8')); complete = true; } catch {}
  const plan = selectStagingChecks({event:process.env.GITHUB_EVENT_NAME,changes,complete});
  console.log(JSON.stringify(plan));
  if (!process.env.GITHUB_OUTPUT) throw Error('GITHUB_OUTPUT is required');
  const identity = ['GITHUB_SHA','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','GITHUB_WORKFLOW_REF'].map(key=>process.env[key]);
  if (identity.some(value=>!value || /[\r\n]/.test(value))) throw Error('Missing or malformed execution identity');
  appendFileSync(process.env.GITHUB_OUTPUT, 'media='+plan.media+'\nidentity='+identity.join(':')+'\n');
}
