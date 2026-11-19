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
 const result=spawnSync('/bin/bash',[script],{encoding:'utf8',timeout:10000,env:{...process.env,PATH:root,GITHUB_ACTIONS:"false",RUNNER_ENVIRONMENT:"",MEDIA_TEST_LOG:log}});
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

function hosted(t,{fail='',omit='',id='ubuntu',version='24.04',codename='noble',arch='x86_64',keyring=true}={}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'media-hosted-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const log=path.join(root,'calls.jsonl'), osRelease=path.join(root,'os-release'), key=path.join(root,'archive-keyring.gpg');
 fs.writeFileSync(osRelease,`ID=${id}\nVERSION_ID=${version}\nVERSION_CODENAME=${codename}\n`);
 if(keyring)fs.writeFileSync(key,'test-only-keyring');
 // Rewrite only the two absolute OS-file references in a fixture copy. The real
 // script has no environment-variable override for OS identity or signing keys.
 const source=fs.readFileSync(script,'utf8');
 assert.equal(source.split('. /etc/os-release').length,2);
 assert.equal(source.split('keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg').length,2);
 const fixture=path.join(root,'bootstrap.sh');
 fs.writeFileSync(fixture,source.replace('. /etc/os-release',`. ${osRelease}`).replace('keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg',`keyring=${key}`));
 for(const name of ['mktemp','chmod','cat','rm'])fs.symlinkSync('/usr/bin/'+name,path.join(root,name));
 fs.writeFileSync(path.join(root,'uname'),`#!${process.execPath}\nprocess.stdout.write(${JSON.stringify(arch+'\n')});`,{mode:0o755});
 const versionExecutable=name=>`#!${process.execPath}\nrequire('node:fs').appendFileSync(process.env.MEDIA_TEST_LOG,JSON.stringify({args:[${JSON.stringify(name)},...process.argv.slice(2)]})+'\\n');\n`;
 fs.writeFileSync(path.join(root,'sudo'),`#!${process.execPath}
const fs=require('node:fs'),path=require('node:path');
const args=process.argv.slice(2);
if(args[0]!=='timeout'||args[1]!=='--kill-after=10s'||args[3]!=='apt-get')process.exit(91);
const file=args.find(a=>a.startsWith('Dir::Etc::sourcelist='))?.split('=')[1];
fs.appendFileSync(process.env.MEDIA_TEST_LOG,JSON.stringify({args,sourceFile:file,sources:fs.readFileSync(file,'utf8')})+'\\n');
const phase=args.includes('update')?'update':args.includes('--download-only')?'download':'install';
if(phase===${JSON.stringify(fail)})process.exit(124);
if(phase==='install')for(const name of ['ffmpeg','ffprobe']){
 if(name===${JSON.stringify(omit)})continue;
 fs.writeFileSync(path.join(${JSON.stringify(root)},name),${JSON.stringify({ffmpeg:versionExecutable('ffmpeg'),ffprobe:versionExecutable('ffprobe')})}[name],{mode:0o755});
}
`,{mode:0o755});
 const result=spawnSync('/bin/bash',[fixture],{encoding:'utf8',timeout:10000,env:{...process.env,PATH:root,TMPDIR:root,GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',MEDIA_TEST_LOG:log}});
 return {result,key,calls:fs.existsSync(log)?fs.readFileSync(log,'utf8').trim().split('\n').map(JSON.parse):[]};
}
test('hosted Ubuntu uses official signed sources per invocation and bounds downloads',t=>{
 const {result,calls,key}=hosted(t);assert.equal(result.status,0,result.stderr);
 assert.equal(calls.length,5);
 for(const [i,seconds] of ['120s','240s','180s'].entries()){
  const call=calls[i];assert.deepEqual(call.args.slice(0,4),['timeout','--kill-after=10s',seconds,'apt-get']);
  for(const option of ['Dir::Etc::sourceparts=-','Acquire::http::Timeout=20','Acquire::https::Timeout=20','Acquire::Retries=1','APT::Update::Error-Mode=any'])assert.ok(call.args.includes(option),option);
  assert.equal((call.sources.match(/Signed-By: /g)||[]).length,2);assert.ok(call.sources.includes('Signed-By: '+key));
  assert.ok(call.sources.includes('URIs: https://archive.ubuntu.com/ubuntu/'));
  assert.ok(call.sources.includes('URIs: https://security.ubuntu.com/ubuntu/'));
  assert.doesNotMatch(call.sources,/trusted=yes|allow-insecure|ec2|http:\/\//);
  assert.equal(fs.existsSync(call.sourceFile),false,'Temporary sources cleaned after process exit');
 }
 assert.equal(calls[0].args.at(-1),'update');
 assert.ok(calls[1].args.includes('--download-only'));assert.ok(!calls[1].args.includes('--no-download'));
 assert.ok(calls[2].args.includes('--no-download'));assert.ok(!calls[2].args.includes('--download-only'));
 for(const call of calls.slice(1,3)){assert.ok(call.args.includes('--no-install-recommends'));assert.equal(call.args.at(-1),'ffmpeg');}
 assert.deepEqual(calls.slice(3).map(c=>c.args),[['ffmpeg','-version'],['ffprobe','-version']]);
});
for(const [fail,count] of [['update',1],['download',2],['install',3]])test('hosted '+fail+' failure/timeout stops immediately',t=>{
 const {result,calls}=hosted(t,{fail});assert.equal(result.status,124);assert.equal(calls.length,count);
 assert.ok(calls.every(c=>!fs.existsSync(c.sourceFile)),'sources always cleaned');
 if(fail!=='install')assert.ok(!calls.some(c=>c.args.includes('--no-download')),'no dpkg transaction on download failure');
});
for(const options of [{id:'debian'},{version:'22.04'},{codename:'jammy'},{arch:'aarch64'},{keyring:false}])test('hosted unsupported platform/key fails closed '+JSON.stringify(options),t=>{
 const {result,calls}=hosted(t,options);assert.notEqual(result.status,0);assert.deepEqual(calls,[]);
});
test('hosted installation still requires both resulting binaries',t=>{
 const {result,calls}=hosted(t,{omit:'ffprobe'});assert.notEqual(result.status,0);assert.deepEqual(calls.at(-1).args,['ffmpeg','-version']);
});
test('bootstrap never weakens package authentication or rewrites global apt configuration',()=>{
 const source=fs.readFileSync(script,'utf8');
 assert.doesNotMatch(source,/--allow-unauthenticated|AllowInsecure|AllowUnauthenticated|trusted=yes|Check-Valid-Until=false/);
 assert.doesNotMatch(source,/>\s*['"]?\/etc\/apt|sed .*\/etc\/apt|tee .*\/etc\/apt/);
 assert.match(source,/\[ "\$\{GITHUB_ACTIONS:-\}" = true \] && \[ "\$\{RUNNER_ENVIRONMENT:-\}" = github-hosted \]/);
});
