import fs from 'node:fs';
import path from 'node:path';
import authority from '../qa/week8-owner-playback-waiver.json';
import {selectWeek8PreviewCohort} from './week8-preview-cohort.mjs';
import {writers} from '../app/articles/writers';

export function week8Reels(edition) {
  let manifest;
  try {
    // The file is created only by complete-cohort assembly. No placeholder file.
    manifest=JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/week8-approved-homepage-media.json'),'utf8'));
  } catch {return [];}
  const rows=selectWeek8PreviewCohort(manifest,edition,authority);
  if(rows.some(r=>!writers[r.writer]))return [];
  // Send presentation fields only to the client, not release evidence.
  return rows.map(r=>({id:r.id,teamIds:r.teamIds,short:r.short,matchup:r.matchup,left:r.left,right:r.right,
    writer:r.writer,correspondent:writers[r.writer].name,avatar:writers[r.writer].image}));
}
