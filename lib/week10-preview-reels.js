import fs from 'node:fs';
import path from 'node:path';
import {writers} from '../app/articles/writers';
import {selectWeek10PreviewCohort,selectWeek10Matchup} from './week10-preview-cohort.mjs';
export function week10PreviewRows(edition){
 try{return selectWeek10PreviewCohort(JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/week10-approved-homepage-media.json'),'utf8')),edition,JSON.parse(fs.readFileSync(path.join(process.cwd(),'qa/week10-publication-authority.json'),'utf8')));}catch{return [];}
}
export function week10PreviewReels(edition){
 const rows=week10PreviewRows(edition);if(rows.some(r=>!writers[r.writer]))return [];
 return rows.map(r=>({id:r.id,teamIds:r.teamIds,short:r.short,matchup:r.matchup,left:r.left,right:r.right,writer:r.writer,correspondent:writers[r.writer].name,avatar:writers[r.writer].image}));
}
export function week10MatchupReels(edition,week,a,b){return selectWeek10Matchup(week10PreviewReels(edition).map(r=>({...r,edition})),edition,week,a,b);}
