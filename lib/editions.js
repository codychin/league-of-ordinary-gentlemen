export const editions = {
 'sunday-crew': {slug:'sunday-crew',root:'/sunday-crew',name:'Sunday Crew',publicationName:'The Sunday Crew Times',mark:'SC',providerLeagueKey:'470.l.197826'},
 doge: {slug:'doge',root:'/doge',name:'DOGE4',publicationName:'The DOGE Dispatch',mark:'D4',providerLeagueKey:'470.l.226614'},
};
export function editionForPath(path=''){return Object.values(editions).find(e=>path===e.root||path.startsWith(e.root+'/'))||null;}
export function editionConfig(slug){const e=editions[slug];if(!e)throw new Error('Unknown edition');return e;}
