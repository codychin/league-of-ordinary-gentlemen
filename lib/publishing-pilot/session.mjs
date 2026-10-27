import {createServerClient} from '@supabase/ssr';
import {pilotConfig} from './model.mjs';

// Existing sessions only. This adapter never signs up users or uses admin keys.
export function sessionClient(cookies, env=process.env, transport=fetch) {
 const config=pilotConfig(env);
 return createServerClient(config.url,config.key,{cookies,global:{fetch:(url,options)=>transport(url,{...options,cache:'no-store',signal:AbortSignal.timeout(5000)})}});
}
export async function confirmedSession(db,tokens=null) {
 if(tokens){
  if(typeof tokens.access_token!=='string'||typeof tokens.refresh_token!=='string'||tokens.access_token.length>16000||tokens.refresh_token.length>16000)throw Error('Invalid session');
  const {error}=await db.auth.setSession({access_token:tokens.access_token,refresh_token:tokens.refresh_token});
  if(error)throw Error('Session rejected');
 }
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user?.email_confirmed_at)throw Error('Confirmed session required');
 return user;
}
