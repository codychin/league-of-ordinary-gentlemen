import fs from 'node:fs';
import path from 'node:path';
import {selectWeek9PreviewCohort} from './week9-preview-cohort.mjs';
import {writers} from '../app/articles/writers';

export function week9PreviewRows(edition) {
  try {
    const manifest=JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/week9-approved-homepage-media.json'),'utf8'));
    const authority=JSON.parse(fs.readFileSync(path.join(process.cwd(),'qa/week9-owner-playback-waiver.json'),'utf8'));
    return selectWeek9PreviewCohort(manifest,edition,authority);
  } catch {return [];}
}

export function week9PreviewReels(edition) {
  const rows=week9PreviewRows(edition);
  if(rows.some(r=>!writers[r.writer]))return [];
  return rows.map(r=>({id:r.id,teamIds:r.teamIds,short:r.short,matchup:r.matchup,left:r.left,right:r.right,
    writer:r.writer,correspondent:writers[r.writer].name,avatar:writers[r.writer].image}));
}
