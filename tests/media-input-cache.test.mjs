import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync,chmodSync,linkSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mediaInputPlan,verifyMediaInputs,MEDIA_ROOTS,CACHE_VERSION} from '../scripts/operations/media-input-cache.mjs';
const script=resolve('scripts/operations/media-input-cache.mjs');
function fixture(callback,{format='sha1'}={}) {
  const dir=mkdtempSync(join(tmpdir(),'brief-media-cache-'));
  const git=(...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const put=(path,value='fixture')=>{mkdirSync(join(dir,path,'..'),{recursive:true});writeFileSync(join(dir,path),value);};
  git('init','--quiet','--object-format='+format);
  for(const [i,prefix] of MEDIA_ROOTS.entries())put(prefix+'/fixture.bin',Buffer.from([0,1,2,3,i,255]));
  put('README.md','not cached');
  const commit=()=>{git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','fixture');};
  commit();
  return Promise.resolve().then(()=>callback({dir,git,put,commit})).finally(()=>rmSync(dir,{recursive:true,force:true}));
}
const fails=async(dir,code)=>assert.rejects(verifyMediaInputs(dir),error=>error.code===code);
test('warm input cache validates all exact Git blobs',()=>fixture(async({dir})=>{
 const result=await verifyMediaInputs(dir);assert.deepEqual({...result,key:undefined},{ok:true,key:undefined,files:3,bytes:18});
 const plan=mediaInputPlan(dir);assert.equal(result.key,plan.key);assert.ok(result.key.startsWith(CACHE_VERSION+'-sha1-'));
 assert.equal(plan.trees.length,3);
}));
test('key survives a source-only commit but changes for media input commit',()=>fixture(({dir,put,commit})=>{
 const before=mediaInputPlan(dir).key;put('README.md','changed source');commit();assert.equal(mediaInputPlan(dir).key,before);
 put('media-sources/fixture.bin','changed');commit();assert.notEqual(mediaInputPlan(dir).key,before);
}));
test('key generation requires metadata, not checked-out media bytes',()=>fixture(async({dir})=>{
 const key=mediaInputPlan(dir).key;for(const path of MEDIA_ROOTS)rmSync(join(dir,path),{recursive:true});
 assert.equal(mediaInputPlan(dir).key,key);await fails(dir,'MISSING_MEDIA_DIRECTORY');
}));
test('missing leaf fails closed',()=>fixture(async({dir})=>{rmSync(join(dir,'public/reels/fixture.bin'));await fails(dir,'MISSING_MEDIA_FILE');}));
test('same-length corruption fails closed',()=>fixture(async({dir,put})=>{put('public/reels/fixture.bin',Buffer.alloc(6,7));await fails(dir,'MEDIA_CONTENT_MISMATCH');}));
test('different-size corruption fails closed',()=>fixture(async({dir,put})=>{put('public/reels/fixture.bin','bad');await fails(dir,'MEDIA_CONTENT_MISMATCH');}));
test('extra leaf fails closed',()=>fixture(async({dir,put})=>{put('media-sources/untracked','extra');await fails(dir,'UNEXPECTED_MEDIA_PATH');}));
test('extra empty directory fails closed',()=>fixture(async({dir})=>{mkdirSync(join(dir,'media-sources/extra'));await fails(dir,'UNEXPECTED_MEDIA_PATH');}));
test('unrelated noncached public files do not affect verification',()=>fixture(async({dir,put})=>{put('public/images/ignored','uncached');assert.equal((await verifyMediaInputs(dir)).files,3);}));
test('leaf symlink rejected without opening its target',()=>fixture(async({dir})=>{
 rmSync(join(dir,'public/reels/fixture.bin'));symlinkSync('/nonexistent-outside',join(dir,'public/reels/fixture.bin'));await fails(dir,'UNSAFE_MEDIA_FILE');
}));
test('symlink ancestor rejected',()=>fixture(async({dir})=>{
 rmSync(join(dir,'public/reels'),{recursive:true});symlinkSync('/nonexistent-outside',join(dir,'public/reels'));await fails(dir,'UNSAFE_MEDIA_DIRECTORY');
}));
test('tracked symlink is never an eligible input',()=>fixture(async({dir,git,commit})=>{
 symlinkSync('../README.md',join(dir,'media-sources/link'));commit();assert.throws(()=>mediaInputPlan(dir),error=>error.code==='UNSUPPORTED_TRACKED_TYPE');
}));
test('hardlinked cache file rejected',()=>fixture(async({dir})=>{
 linkSync(join(dir,'public/reels/fixture.bin'),join(dir,'outside-cache'));await fails(dir,'UNSAFE_MEDIA_FILE');
}));
test('unexpected executable bit rejected',()=>fixture(async({dir})=>{chmodSync(join(dir,'media-sources/fixture.bin'),0o755);await fails(dir,'MEDIA_MODE_MISMATCH');}));
test('tracked executable regular blob is hashed, never executed',()=>fixture(async({dir,put,commit})=>{
 put('media-sources/script.sh','#!/bin/sh\nexit 91\n');chmodSync(join(dir,'media-sources/script.sh'),0o755);commit();assert.equal((await verifyMediaInputs(dir)).files,4);
}));
test('tracked control-character path rejected',()=>fixture(({dir,put,commit})=>{put('media-sources/bad\nname','bad');commit();assert.throws(()=>mediaInputPlan(dir),error=>error.code==='UNSAFE_TRACKED_PATH');}));
test('tracked backslash path rejected',()=>fixture(({dir,put,commit})=>{put('media-sources/bad\\name','bad');commit();assert.throws(()=>mediaInputPlan(dir),error=>error.code==='UNSAFE_TRACKED_PATH');}));
test('missing required Git tree rejected',()=>fixture(({dir,git,commit})=>{
 rmSync(join(dir,'media-sources'),{recursive:true});commit();assert.throws(()=>mediaInputPlan(dir),error=>error.code==='GIT_METADATA_UNAVAILABLE');
}));
test('SHA-256 repositories use Git SHA-256 blob identities',()=>fixture(async({dir})=>{assert.equal((await verifyMediaInputs(dir)).files,3);assert.match(mediaInputPlan(dir).key,/-sha256-(?:[a-f0-9]{64}-){2}[a-f0-9]{64}$/);},{format:'sha256'}));
test('CLI success is bounded JSON and key only',()=>fixture(({dir})=>{
 const key=spawnSync(process.execPath,[script,'key',dir],{encoding:'utf8'});assert.equal(key.status,0,key.stderr);assert.equal(key.stdout.trim(),mediaInputPlan(dir).key);
 const result=spawnSync(process.execPath,[script,'verify',dir],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).ok,true);
}));
test('CLI failure is nonzero, no raw filesystem or Git diagnostics',()=>fixture(({dir,put})=>{
 put('media-sources/fixture.bin','do-not-print-cache-contents');const result=spawnSync(process.execPath,[script,'verify',dir],{encoding:'utf8'});
 assert.equal(result.status,1);assert.equal(result.stdout,'');assert.equal(result.stderr,'Media input cache: MEDIA_CONTENT_MISMATCH\n');
}));
test('CLI bad command and missing repository fail closed',()=>{
 for(const args of [[],['restore'],['key','/nonexistent']]){
  const result=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});assert.equal(result.status,1);assert.equal(result.stdout,'');assert.match(result.stderr,/^Media input cache: [A-Z_]+\n$/);
 }
});
test('verifier never fetches or mutates the input tree',()=>fixture(async({dir})=>{
 const source=readFileSync(script,'utf8');assert.match(source,/GIT_NO_LAZY_FETCH:'1'/);assert.doesNotMatch(source,/git\(root,\s*\['(?:fetch|checkout|reset|clean|config|add)'/);
 const before=execFileSync('git',['-C',dir,'status','--porcelain'],{encoding:'utf8'});await verifyMediaInputs(dir);assert.equal(execFileSync('git',['-C',dir,'status','--porcelain'],{encoding:'utf8'}),before);
}));

test('FIFO cache content rejected without opening or blocking',()=>fixture(async({dir})=>{
 execFileSync('mkfifo',[join(dir,'media-sources/extra-pipe')]);await fails(dir,'UNSAFE_MEDIA_FILE');
}));
test('file replacing required directory rejected',()=>fixture(async({dir,put})=>{
 rmSync(join(dir,'public/reels'),{recursive:true});put('public/reels','not a directory');await fails(dir,'UNSAFE_MEDIA_DIRECTORY');
}));
test('directory replacing tracked file rejected',()=>fixture(async({dir})=>{
 rmSync(join(dir,'public/reels/fixture.bin'));mkdirSync(join(dir,'public/reels/fixture.bin'));await fails(dir,'UNEXPECTED_MEDIA_PATH');
}));
test('Git blob replacing media root is ineligible',()=>fixture(({dir,put,commit})=>{
 rmSync(join(dir,'media-sources'),{recursive:true});put('media-sources','not a tree');commit();
 assert.throws(()=>mediaInputPlan(dir),error=>error.code==='INVALID_MEDIA_TREE');
}));
test('tracked gitlink is never an eligible input',()=>fixture(({dir,git})=>{
 const commit=git('rev-parse','HEAD').trim();
 git('update-index','--add','--cacheinfo','160000,'+commit+',media-sources/submodule');
 git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','gitlink fixture');
 assert.throws(()=>mediaInputPlan(dir),error=>error.code==='UNSUPPORTED_TRACKED_TYPE');
}));
