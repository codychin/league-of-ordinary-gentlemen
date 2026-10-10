import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const path='scripts/operations/assert-production-boundary.mjs';
const project='prj_h89MCmxn3Mr3O0wRpnwstM917E0l';
function check(extra){
 return spawnSync(process.execPath,[path],{encoding:'utf8',env:{...process.env,VERCEL_PROJECT_ID:project,VERCEL_ENV:'production',BRIEF_ENV:'production',NEXT_PUBLIC_BRIEF_ENV:'production',...extra}})
}
test('production rejects staging code branches',()=>assert.notEqual(check({VERCEL_GIT_COMMIT_REF:'staging'}).status,0));
test('production rejects QA flags',()=>assert.notEqual(check({VERCEL_GIT_COMMIT_REF:'main',NEXT_PUBLIC_BRIEF_ENV:'staging'}).status,0));
test('production accepts main without QA',()=>assert.equal(check({VERCEL_GIT_COMMIT_REF:'main'}).status,0));
test('exactly three global front-page cards',()=>{
 const front=readFileSync('app/components/SharedEditorialFront.js','utf8');
 const section=front.match(/<section className=\{front\.recent\}[^>]*>([\s\S]*?)<\/section>/);
 assert.ok(section,'Missing global stories section');
 assert.equal((section[1].match(/<article className=\{front\.card\}/g)||[]).length,3);
});
test('global stories come after Jaguars feature',()=>{
 const s=readFileSync('app/components/SharedEditorialFront.js','utf8');
 assert.ok(s.indexOf('On Assignment: Dashiell Pike in London')<s.indexOf('aria-label="Recent stories"'));
});

test('every globally featured story resolves through the global edition allowlist',()=>{
 const front=readFileSync('app/components/SharedEditorialFront.js','utf8');
 const scope=readFileSync('lib/editorial-scope.js','utf8');
 const recent=front.match(/<section className=\{front\.recent\}[^>]*>([\s\S]*?)<\/section>/);
 assert.ok(recent,'Global article section missing');
 const slugs=[...recent[1].matchAll(/root\+"\/articles\/([a-z0-9-]+)"/g)].map(m=>m[1]);
 assert.equal(slugs.length,3,'Expected three global story links');
 for(const slug of slugs)assert.ok(scope.includes("'"+slug+"'"),'Global carousel story not available in league editions: '+slug);
});
