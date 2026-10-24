import assert from 'node:assert/strict';
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
export const EDITIONS=['loog','sunday-crew','doge'];
export const JAY='conrad-allow-me-to-reintroduce-myself';
export const NEW='pilot-staging-lead';
export function correction(base){
 const r=structuredClone(base);
 for(const e of EDITIONS)r.editions[e].articles[JAY].dek+=' [STAGING CORRECTION]';
 return r;
}
export function rotation(base){
 const r=structuredClone(base);
 for(const e of EDITIONS){const s=r.editions[e];s.articles[NEW]={...structuredClone(s.articles[JAY]),slug:NEW,title:'Staging rotation proof',dek:'Staging-only copy. Not approved for production.',order:-1};s.home.unshift(NEW);}
 return r;
}
export function localFixture(base){
 const r=structuredClone(base),s=r.editions.doge;
 s.articles['pilot-doge-local']={...structuredClone(s.articles[JAY]),slug:'pilot-doge-local',scope:'doge',title:'DOGE isolation fixture',order:-1};
 s.home.unshift('pilot-doge-local');return r;
}
// Bounded pilot contract: no arbitrary HTML/media/creative input. Existing immutable body
// blocks and assets stay byte-identical; only these explicit staging scenarios are accepted.
export function validateCandidate(candidate,baseline){
 assert.equal(candidate.schemaVersion,1);assert.equal(candidate.renderer,baseline.renderer);
 const permitted=[baseline,correction(baseline),rotation(baseline),localFixture(baseline)];
 assert.ok(permitted.some(p=>canonical(p)===canonical(candidate)),'outside reviewed pilot scenarios');
 for(const e of EDITIONS){const s=candidate.editions[e];assert.equal(new Set(s.home).size,s.home.length);assert.equal(s.home.slice(1,4).length,3);
 for(const slug of s.home){assert.ok(s.articles[slug]);assert.ok(['global',e].includes(s.articles[slug].scope));}
 const original=s.home.filter(slug=>baseline.editions[e].home.includes(slug));assert.deepEqual(original,baseline.editions[e].home);
 assert.deepEqual(s.archive,baseline.editions[e].archive);
 }
 return true;
}
export function pilotConfig(env=process.env){
 if(env.BRIEF_PILOT_ENABLED!=='1'||env.VERCEL_ENV==='production')throw Error('Pilot disabled');
 const url=new URL(env.BRIEF_PILOT_SUPABASE_URL||'https://invalid.invalid');
 if(url.hostname==='dnzdbqycuuoonewcowis.supabase.co'||url.hostname==='fptdqutdzcxhrponaykv.supabase.co')throw Error('Production/unrelated database forbidden');
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Invalid pilot origin');
 const local=['127.0.0.1','localhost'].includes(url.hostname);
 if(!local&&(url.protocol!=='https:'||!env.BRIEF_PILOT_VERIFIED_PROJECT_REF||url.hostname!==env.BRIEF_PILOT_VERIFIED_PROJECT_REF+'.supabase.co'))throw Error('Verified isolated database required');
 if(!env.BRIEF_PILOT_RENDERER_ID||!env.BRIEF_PILOT_PUBLISHABLE_KEY)throw Error('Pilot configuration incomplete');
 return {url:url.origin,key:env.BRIEF_PILOT_PUBLISHABLE_KEY,renderer:env.BRIEF_PILOT_RENDERER_ID};
}

export function validateSnapshot(snapshot,baseline,edition){
 assert.ok(EDITIONS.includes(edition));
 const permitted=[baseline,correction(baseline),rotation(baseline),localFixture(baseline)].map(p=>p.editions[edition]);
 assert.ok(permitted.some(p=>canonical(p)===canonical(snapshot)),'unreviewed pilot snapshot');
 return true;
}
