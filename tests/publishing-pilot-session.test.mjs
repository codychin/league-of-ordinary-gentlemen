import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionClient,confirmedSession} from '../lib/publishing-pilot/session.mjs';
const env={BRIEF_PILOT_ENABLED:'1',BRIEF_PILOT_SUPABASE_URL:'http://127.0.0.1:4319',BRIEF_PILOT_PUBLISHABLE_KEY:'synthetic-only',BRIEF_PILOT_RENDERER_ID:'test'};
const user={id:'00000000-0000-4000-8000-000000000001',email_confirmed_at:'2026-01-01',aud:'authenticated'};
const token=exp=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp})).toString('base64url'),Buffer.from('synthetic').toString('base64url')].join('.');
test('SSR bootstrap, expired-session refresh and reload persist rotated cookies without admin credentials',async()=>{
 let jar=[],refreshes=0;const calls=[];
 const transport=async(url,options)=>{
  calls.push({url:String(url),options});
  if(String(url).includes('/token?grant_type=refresh_token')){
   refreshes++;return Response.json({access_token:token(4102444800),refresh_token:'rotated-synthetic',expires_in:3600,token_type:'bearer',user});
  }
  return Response.json(user);
 };
 const cookies={getAll:()=>jar,setAll:values=>{jar=values.filter(v=>v.value);}};
 await confirmedSession(sessionClient(cookies,env,transport),{access_token:token(1),refresh_token:'expired-synthetic'});
 assert.equal(refreshes,1);assert.ok(jar.length);assert.ok(jar.every(c=>c.options.sameSite==='lax'));
 await confirmedSession(sessionClient(cookies,env,transport));
 assert.equal(refreshes,1);assert.ok(calls.every(c=>c.url.startsWith(env.BRIEF_PILOT_SUPABASE_URL)));
 assert.ok(calls.every(c=>c.options.cache==='no-store'));
});
test('revoked refresh and unconfirmed identity are rejected',async()=>{
 const cookies={getAll:()=>[],setAll:()=>{}};
 await assert.rejects(confirmedSession(sessionClient(cookies,env,async()=>Response.json({message:'revoked'},{status:400})),{access_token:token(1),refresh_token:'revoked'}));
 await assert.rejects(confirmedSession(sessionClient(cookies,env,async()=>Response.json({...user,email_confirmed_at:null})),{access_token:token(4102444800),refresh_token:'synthetic'}));
});
test('disabled and production targets fail before any network/session bootstrap',()=>{
 for(const overrides of [{BRIEF_PILOT_ENABLED:'0'},{VERCEL_ENV:'production'},{BRIEF_PILOT_SUPABASE_URL:'https://dnzdbqycuuoonewcowis.supabase.co'}])
  assert.throws(()=>sessionClient({getAll:()=>[],setAll:()=>{}},{...env,...overrides},()=>{throw Error('network must not run');}));
});
