import fs from 'node:fs';
import path from 'node:path';
import {selectWeek8RecapCohort} from './week8-recap-cohort.mjs';
import {writers} from '../app/articles/writers';

export function week8RecapRows(edition) {
  try {
    const manifest=JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/week8-recap-approved-homepage-media.json'),'utf8'));
    const authority=JSON.parse(fs.readFileSync(path.join(process.cwd(),'qa/week8-recap-owner-playback-waiver.json'),'utf8'));
    return selectWeek8RecapCohort(manifest,edition,authority);
  } catch {return [];}
}

export function week8RecapReels(edition) {
  const rows=week8RecapRows(edition);
  if(rows.some(r=>!writers[r.writer]))return [];
  return rows.map(r=>({id:r.id,teamIds:r.teamIds,short:r.short,matchup:r.matchup,left:r.left,right:r.right,
    writer:r.writer,correspondent:writers[r.writer].name,avatar:writers[r.writer].image}));
}
