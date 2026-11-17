import fs from 'node:fs';
import path from 'node:path';
import {selectWeek10RecapCohort,selectWeek10RecapMatchup} from './week10-recap-cohort.mjs';
import {writers} from '../app/articles/writers';

export function week10RecapRows(edition) {
  try {
    const manifest=JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/week10-recap-approved-homepage-media.json'),'utf8'));
    const authority=JSON.parse(fs.readFileSync(path.join(process.cwd(),'qa/week10-recap-owner-playback-waiver.json'),'utf8'));
    return selectWeek10RecapCohort(manifest,edition,authority);
  } catch {return [];}
}

export function week10RecapReels(edition) {
  const rows=week10RecapRows(edition);
  if(rows.some(r=>!writers[r.writer]))return [];
  return rows.map(r=>({id:r.id,teamIds:r.teamIds,short:r.short,matchup:r.matchup,left:r.left,right:r.right,
    writer:r.writer,correspondent:writers[r.writer].name,avatar:writers[r.writer].image}));
}

export function week10RecapMatchupReels(edition,week,a,b){return selectWeek10RecapMatchup(week10RecapReels(edition).map(r=>({...r,edition})),edition,week,a,b);}
