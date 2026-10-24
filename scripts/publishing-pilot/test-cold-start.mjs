import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {sessionCookie} from './local-gateway.mjs';
import {call,RENDERER} from './local-db.mjs';
const before=await call('read',{edition:'loog'}),cookie=sessionCookie();
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','4321'],{env:{...process.env,BRIEF_PILOT_ENABLED:'1',BRIEF_PILOT_ORIGIN:'http://127.0.0.1:4321',BRIEF_PILOT_SUPABASE_URL:'http://127.0.0.1:4319',BRIEF_PILOT_PUBLISHABLE_KEY:'local-test-publishable',BRIEF_PILOT_RENDERER_ID:RENDERER},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(Error('Cold server did not start')),10000);server.stdout.on('data',b=>{output+=b;if(output.includes('Ready')){clearTimeout(timeout);resolve();}});server.on('exit',code=>{clearTimeout(timeout);reject(Error('Server exited '+code));});});
 const start=performance.now();const response=await fetch('http://127.0.0.1:4321/publishing-pilot/loog',{headers:{Cookie:cookie.name+'='+cookie.value}}),ttfb=performance.now()-start;
 const html=await response.text();assert.ok(html.includes('data-pilot-release="'+before.digest+'"'));assert.ok(html.includes('data-pilot-renderer="'+RENDERER+'"'));
 writeFileSync('/tmp/brief-pilot-cold-start.json',JSON.stringify({kind:'fresh-local-next-process-real-postgres-synthetic-auth',renderer:RENDERER,digest:before.digest,ttfbMs:ttfb,responseMs:performance.now()-start,passed:true},null,2));console.log('PASS cold renderer process reads durable committed release',Math.round(ttfb)+'ms TTFB');
}finally{server.kill('SIGTERM');}
