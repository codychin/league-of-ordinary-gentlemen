#!/usr/bin/env node
// Live project release isolation. This is deliberately executed before Next.js builds.
// Never make a staging-branch build eligible to serve public domains.
const LIVE_PROJECT='prj_h89MCmxn3Mr3O0wRpnwstM917E0l';
const live=process.env.VERCEL_PROJECT_ID===LIVE_PROJECT;
const prod=process.env.VERCEL_ENV==='production';
const branch=process.env.VERCEL_GIT_COMMIT_REF;
const qa=process.env.BRIEF_ENV==='staging'||process.env.NEXT_PUBLIC_BRIEF_ENV==='staging';
if(live&&prod){
 if(branch!=='main')throw new Error('RELEASE BLOCKED: live production project must build from main, got '+String(branch));
 if(qa)throw new Error('RELEASE BLOCKED: staging flags are forbidden on live production');
}
if(live&&qa&&prod)throw Error('QA mode may not be deployed to production');
console.log('Release isolation check passed',live?'live project':'other project',prod?'production':'non-production');
