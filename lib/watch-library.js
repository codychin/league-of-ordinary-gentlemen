// Staging collection: existing published editorial media and approved Week 7 packages only.
// Maracana provenance: f3f6775^ (archived from the homepage, not withdrawn).
import {globalArticleVideos,loogArticleVideos} from './article-videos';
import recaps from '../data/week7-approved-homepage-media.json';
import previews from '../data/week7-preview-homepage-media.json';
import durations from '../data/watch-verified-durations.json';
import {writers} from '../app/articles/writers';
const features=[
{id:'sabine-maracana',correspondent:'Sabine March',title:'Sunday at the Maracanã',poster:'https://cdn.openart.ai/openart/thumbnail/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465571680_924949be.webp',src:'https://cdn.openart.ai/openart-ai/production/2026-09/create-video/TLTpmJfydK54x1UaTK6G/cgt-20260927072638-56wll_1790465560812_7dd1af7e.mp4',fallbackPoster:'/images/editorial/maracana-stadium.webp',kind:'Feature',slug:'sabine-sunday-maracana',dek:'Everybody wants the stadium. The grass has begun to object.'},
{"id": "dashiell-jaguars", "title": "Is the NFL\u2019s Future Hiding Inside Its Weirdest Franchise?", "correspondent": "Dashiell Pike", "poster": "https://cdn.openart.ai/openart/thumbnail/production/2026-10/create-video/TLTpmJfydK54x1UaTK6G/cgt-20261008002242-mexhp_1791390729765_82dc1525.webp", "src": "https://cdn.openart.ai/openart-ai/production/2026-10/create-video/TLTpmJfydK54x1UaTK6G/cgt-20261008002242-mexhp_1791390692996_b5b0afba.mp4", "kind": "Feature", "slug": "dashiell-jaguars-london-future", "dek": "A dispatch from London, where Jacksonville begins to look like something else."}];
export function watchLibrary(edition='loog'){
 const editorial=edition==='loog'?loogArticleVideos:globalArticleVideos;
 return {features:[...features,...editorial.map(v=>({...v,kind:'Dispatch'}))],matchups:[...recaps.filter(v=>v.publicationApproved===true),...previews.filter(v=>v.qaStatus==='media_qa_passed'&&v.approvalSource)].filter(v=>v.edition===edition).map(v=>({id:v.id,title:v.matchup,correspondent:writers[v.writer].name,kind:v.kind,week:v.week,season:v.season,durationSeconds:durations[v.id]||v.durationSeconds,poster:`/reels-hls/${v.id}/poster.jpg`,src:`/reels/${v.id}.mp4`,hls:`/reels-hls/${v.id}/index.m3u8`}))};
}
