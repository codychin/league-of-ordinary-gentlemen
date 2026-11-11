import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync as spawnChild} from 'node:child_process';
import {runInNewContext} from 'node:vm';

// Execute the actual production handoff, not a separately reconstructed env.
// The child observes its real environment without launching browsers/network.
function observeHandoff(environment, source=readFileSync('scripts/operations/promote-verified-release.mjs','utf8')) {
 const start=source.indexOf('const media=spawnSync(');
 const end=source.indexOf('assert.equal(media.status,0',start);
 assert.ok(start>=0&&end>start,'production media launch and fail-closed gate must exist');
 let invocation;
 runInNewContext(source.slice(start,end).replaceAll('import.meta.url',JSON.stringify('file:///release/scripts/operations/promote-verified-release.mjs')),{
  process:{execPath:process.execPath,env:environment},URL,
  origin:'https://candidate.vercel.app',sha:'a'.repeat(40),mediaOidc:'synthetic-media-identity',
  spawnSync(executable,args,options){
   invocation={executable,args,options};
   const child=spawnChild(executable,['-e','process.stdout.write(JSON.stringify(process.env))'],options);
   assert.equal(child.status,0,child.stderr);invocation.childEnv=JSON.parse(child.stdout);return child;
  },
 });
 assert.ok(invocation,'actual media handoff executed');return invocation;
}

test('hosted media child receives the same pinned browser location verified by its parent',()=>{
 const {childEnv}=observeHandoff({PATH:'/usr/bin',PLAYWRIGHT_BROWSERS_PATH:'/ms-playwright'});
 assert.equal(childEnv.PLAYWRIGHT_BROWSERS_PATH,'/ms-playwright');
});

test('media handoff remains explicitly scoped and does not inherit parent credentials or HOME',()=>{
 const {childEnv,args,options}=observeHandoff({PATH:'/usr/bin',NODE_OPTIONS:'',PLAYWRIGHT_BROWSERS_PATH:'/ms-playwright',HOME:'/private-home',GH_TOKEN:'synthetic-github-secret',VERCEL_TOKEN:'synthetic-provider-secret',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'synthetic-request-secret',UNRELATED:'must-not-pass'});
 assert.deepEqual(Object.keys(childEnv).sort(),['BASE_URL','NODE_OPTIONS','PATH','PLAYWRIGHT_BROWSERS_PATH','RELEASE_SHA','VERCEL_TRUSTED_OIDC_TOKEN','VERIFIED_CANDIDATE_ORIGIN'].sort());
 assert.equal(childEnv.VERCEL_TRUSTED_OIDC_TOKEN,'synthetic-media-identity');
 assert.equal(childEnv.RELEASE_SHA,'a'.repeat(40));
 assert.equal(childEnv.BASE_URL,childEnv.VERIFIED_CANDIDATE_ORIGIN);
 assert.deepEqual(Array.from(args),['/release/scripts/operations/verify-hosted-week9-media.mjs']);
 assert.equal(options.timeout,240000);assert.equal(options.encoding,'utf8');
});

test('negative control: deleting the pinned-path handoff reproduces child environment loss',()=>{
 const source=readFileSync('scripts/operations/promote-verified-release.mjs','utf8');
 const changed=source.replace('PLAYWRIGHT_BROWSERS_PATH:process.env.PLAYWRIGHT_BROWSERS_PATH,','');
 assert.ok(changed!==source,'negative control must mutate the production handoff');
 const {childEnv}=observeHandoff({PATH:'/usr/bin',PLAYWRIGHT_BROWSERS_PATH:'/ms-playwright'},changed);
 assert.equal(childEnv.PLAYWRIGHT_BROWSERS_PATH,undefined);
});
