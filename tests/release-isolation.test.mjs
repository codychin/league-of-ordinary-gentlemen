import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const script='scripts/operations/assert-release-isolation.mjs';
const project='prj_h89MCmxn3Mr3O0wRpnwstM917E0l';
function run(config){return spawnSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,VERCEL_PROJECT_ID:project,VERCEL_ENV:'production',...config}})}
test('live project rejects staging branch in production',()=>{
 const x=run({VERCEL_GIT_COMMIT_REF:'staging',BRIEF_ENV:'production',NEXT_PUBLIC_BRIEF_ENV:'production'});
 assert.notEqual(x.status,0);assert.match(x.stderr,/RELEASE BLOCKED/);
});
test('live project rejects QA flags even on main',()=>{
 const x=run({VERCEL_GIT_COMMIT_REF:'main',BRIEF_ENV:'staging',NEXT_PUBLIC_BRIEF_ENV:'staging'});
 assert.notEqual(x.status,0);assert.match(x.stderr,/RELEASE BLOCKED/);
});
test('live project accepts clean main production build',()=>{
 const x=run({VERCEL_GIT_COMMIT_REF:'main',BRIEF_ENV:'production',NEXT_PUBLIC_BRIEF_ENV:'production'});
 assert.equal(x.status,0,x.stderr);
});
