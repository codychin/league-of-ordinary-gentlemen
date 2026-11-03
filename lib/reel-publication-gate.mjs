import fs from 'node:fs';
import path from 'node:path';

export function checkApprovedVideoPackage(sources, approvals) {
  const errors = [];
  const approved = new Map();
  const used = new Set();
  for (const a of approvals) {
    if (!a || !a.id || !a.title || !/Approved by Cody/.test(a.approval || '')) errors.push('Approval record incomplete');
    if (approved.has(a.id)) errors.push('Duplicate approval ID: ' + a.id);
    approved.set(a.id,a);
  }
  const editions=['LOOG','Sunday Crew','DOGE'];
  for (const v of sources) {
    if (!v || !v.videoId || !v.title) { errors.push('Source missing identity or title'); continue; }
    if (used.has(v.videoId)) errors.push('Duplicate source ID: ' + v.videoId);
    used.add(v.videoId);
    const a=approved.get(v.videoId);
    if (!a) errors.push('Unapproved video: ' + v.videoId);
    else if (a.title !== v.title) errors.push('Approved title mismatch: ' + v.videoId);
    if (!editions.some(e=>v.title.startsWith(e+' — '))) errors.push('Unknown video edition: ' + v.videoId);
    if (!/^https:\/\//.test(v.videoUrl||'')) errors.push('Missing HTTPS source URL: ' + v.videoId);
  }
  return {ok:errors.length===0, errors,checked:sources.length};
}
export function checkApprovedVideoPackageFiles(root=process.cwd()){
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  return checkApprovedVideoPackage(read('scripts/week5-video-sources.json'),read('data/week5-approved-preview-manifest.json'));
}
