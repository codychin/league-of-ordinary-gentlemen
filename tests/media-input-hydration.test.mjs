import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm,readFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {hydrateMediaInputs} from '../scripts/operations/hydrate-media-inputs.mjs';
import {MEDIA_ROOTS} from '../scripts/operations/media-input-cache.mjs';
async function fixture(fn){
 const root=await mkdtemp(join(tmpdir(),'brief-hydrate-'));const git=(...args)=>execFileSync('git',['-C',root,...args],{stdio:'pipe'});
 try{
 git('init','-q');
 for(const p of MEDIA_ROOTS){await mkdir(join(root,p),{recursive:true});await writeFile(join(root,p,'asset.bin'),'approved');}
 git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture');
 let hydrations=0;
 const hydrate=async()=>{hydrations++;git('checkout','HEAD','--',...MEDIA_ROOTS);};
 await fn({root,hydrate,count:()=>hydrations});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('warm exact cache never rehydrates',()=>fixture(async({root,hydrate,count})=>{
 assert.equal((await hydrateMediaInputs(root,hydrate)).source,'verified-cache');assert.equal(count(),0);
}));
for(const kind of ['missing','corrupt','extra'])test(kind+' cache hydrates and verifies exact Git files',()=>fixture(async({root,hydrate,count})=>{
 if(kind==='missing')await rm(join(root,'public/reels'),{recursive:true});
 if(kind==='corrupt')await writeFile(join(root,'public/reels/asset.bin'),'bad');
 if(kind==='extra')await writeFile(join(root,'public/reels/extra.bin'),'bad');
 assert.equal((await hydrateMediaInputs(root,hydrate)).source,'verified-git');assert.equal(count(),1);
 assert.equal(await readFile(join(root,'public/reels/asset.bin'),'utf8'),'approved');
 await assert.rejects(readFile(join(root,'public/reels/extra.bin')));
}));
test('unsuccessful hydration cannot pass',()=>fixture(async({root})=>{
 await writeFile(join(root,'public/reels/asset.bin'),'bad');
 await assert.rejects(hydrateMediaInputs(root,async()=>{}));
}));
test('hydration callback failure propagates',()=>fixture(async({root})=>{
 await writeFile(join(root,'public/reels/asset.bin'),'bad');
 await assert.rejects(hydrateMediaInputs(root,async()=>{throw Error('network failure');}),/network failure/);
}));
test('symlinked parent never permits cleanup outside workspace',()=>fixture(async({root,hydrate,count})=>{
 const outside=await mkdtemp(join(tmpdir(),'brief-outside-'));
 try{
 await mkdir(join(outside,'reels'));await writeFile(join(outside,'reels/keep'),'safe');
 await rm(join(root,'public'),{recursive:true});await symlink(outside,join(root,'public'));
 await assert.rejects(hydrateMediaInputs(root,hydrate),/Unsafe media parent/);
 assert.equal(await readFile(join(outside,'reels/keep'),'utf8'),'safe');assert.equal(count(),0);
 }finally{await rm(outside,{recursive:true,force:true});}
}));
