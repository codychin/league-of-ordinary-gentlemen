import manifest from '../data/week7-approved-homepage-media.json';
import {writers} from '../app/articles/writers';
export function week7Reels(edition){
 return manifest.filter(r=>r.edition===edition).map(r=>({...r,correspondent:writers[r.writer].name,avatar:writers[r.writer].image}));
}
