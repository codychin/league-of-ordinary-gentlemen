#!/usr/bin/env node
// Enforced on every build in the live Vercel project. No staging artifact may ship.
const live='prj_h89MCmxn3Mr3O0wRpnwstM917E0l';
const production=process.env.VERCEL_ENV==='production';
const liveProject=process.env.VERCEL_PROJECT_ID===live;
const branch=process.env.VERCEL_GIT_COMMIT_REF;
const qa=process.env.BRIEF_ENV==='staging'||process.env.NEXT_PUBLIC_BRIEF_ENV==='staging';
if(production&&liveProject){
 if(branch!=='main')throw Error('PRODUCTION RELEASE BLOCKED: only main can build for public domains, got '+String(branch));
 if(qa)throw Error('PRODUCTION RELEASE BLOCKED: QA flags present');
}
console.log('Environment release boundary accepted');
