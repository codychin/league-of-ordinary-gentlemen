import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const script=path.resolve('scripts/operations/ensure-media-tools.sh');
const install=['apt-get','install','-y','--no-install-recommends','ffmpeg'];
function exercise(t,{present=[],fail='',omit=''}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'media-tools-bootstrap-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const log=path.join(root,'calls.jsonl');
 const executable=name=>`#!${process.execPath}\nconst fs=require('node:fs');\nfs.appendFileSync(process.env.MEDIA_TEST_LOG,JSON.stringify([${JSON.stringify(name)},...process.argv.slice(2)])+'\\n');\nprocess.exit(${fail===name?9:0});\n`;
 for(const name of present)fs.writeFileSync(path.join(root,name),executable(name),{mode:0o755});
 const bootstrap=`#!${process.execPath}
const fs=require('node:fs');
const path=require('node:path');
const args=process.argv.slice(2);
fs.appendFileSync(process.env.MEDIA_TEST_LOG,JSON.stringify(args)+'\\n');
if(args[0]!=='apt-get')process.exit(90);
if(args[1]===${JSON.stringify(fail)})process.exit(8);
if(args[1]==='install')for(const name of ['ffmpeg','ffprobe']){
 if(name===${JSON.stringify(omit)})continue;
 fs.writeFileSync(path.join(${JSON.stringify(root)},name),${JSON.stringify({ffmpeg:executable('ffmpeg'),ffprobe:executable('ffprobe')})}[name],{mode:0o755});
}
`;
 // The subprocess fixture records package requests and creates only fake binaries.
 // It never invokes apt, uses the network, or changes the actual machine packages.
 fs.writeFileSync(path.join(root,'sudo'),bootstrap,{mode:0o755});
 const result=spawnSync('/bin/bash',[script],{encoding:'utf8',timeout:10000,env:{...process.env,PATH:root,MEDIA_TEST_LOG:log}});
 return {result,calls:fs.existsSync(log)?fs.readFileSync(log,'utf8').trim().split('\n').map(JSON.parse):[]};
}
test('existing ffmpeg and ffprobe are both verified without package installation',t=>{
 const {result,calls}=exercise(t,{present:['ffmpeg','ffprobe']});
 assert.equal(result.status,0,result.stderr);
 assert.deepEqual(calls,[['ffmpeg','-version'],['ffprobe','-version']]);
});
for(const present of [[],['ffmpeg'],['ffprobe']])test(`missing media tools install required dependencies and verify both binaries: present ${present.join(',')||'none'}`,t=>{
 const {result,calls}=exercise(t,{present});
 assert.equal(result.status,0,result.stderr);
 assert.deepEqual(calls,[['apt-get','update'],install,['ffmpeg','-version'],['ffprobe','-version']]);
});
for(const fail of ['update','install'])test(`media bootstrap fails closed when apt-get ${fail} fails`,t=>{
 const {result,calls}=exercise(t,{fail});
 assert.notEqual(result.status,0);
 assert.deepEqual(calls,fail==='update'?[['apt-get','update']]:[['apt-get','update'],install]);
});
for(const fail of ['ffmpeg','ffprobe'])test(`media bootstrap fails closed when ${fail} version verification fails`,t=>{
 const {result,calls}=exercise(t,{present:['ffmpeg','ffprobe'],fail});
 assert.notEqual(result.status,0);
 assert.deepEqual(calls,fail==='ffmpeg'?[['ffmpeg','-version']]:[['ffmpeg','-version'],['ffprobe','-version']]);
});
test('successful apt command does not bypass verification of an absent ffprobe',t=>{
 const {result,calls}=exercise(t,{omit:'ffprobe'});
 assert.notEqual(result.status,0);
 assert.deepEqual(calls,[['apt-get','update'],install,['ffmpeg','-version']]);
});
