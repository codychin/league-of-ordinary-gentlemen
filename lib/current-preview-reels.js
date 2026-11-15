import {loadApprovedPreviewRelease} from './approved-preview-release.mjs';
import {writers} from '../app/articles/writers';
export function currentPreviewRelease(edition) {
 const {week,rows}=loadApprovedPreviewRelease();
 const cohort=rows.filter(r=>r.edition===edition);
 if(cohort.length!==6 || cohort.some(r=>!writers[r.writer]))throw Error('RELEASE_COHORT_INVALID');
 return {week,reels:cohort.map(r=>({id:r.id,teamIds:r.teamIds,short:r.short,matchup:r.matchup,left:r.left,right:r.right,writer:r.writer,correspondent:writers[r.writer].name,avatar:writers[r.writer].image}))};
}
