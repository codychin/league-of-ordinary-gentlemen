import {readFileSync} from 'node:fs';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {cache} from 'react';
import {pilotConfig,validateSnapshot} from './model.mjs';
import baseline from '../../tests/fixtures/publishing-pilot/baseline.json';
export async function pilotClient(){
 const config=pilotConfig(),jar=await cookies();
 const actual=process.env.VERCEL_DEPLOYMENT_ID||readFileSync('.next/BUILD_ID','utf8').trim();
 if(actual!==config.renderer)throw Error('Fixed renderer build changed');
 const db=createServerClient(config.url,config.key,{cookies:{getAll:()=>jar.getAll(),setAll:()=>{}},global:{fetch:(url,options)=>fetch(url,{...options,cache:'no-store',signal:AbortSignal.timeout(5000)})}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user?.email_confirmed_at)throw Error('Authenticated pilot session required');
 return {db,config};
}
export async function command(op,args){
 const {db,config}=await pilotClient();
 const {data,error}=await db.rpc('brief_pilot_command',{op,args:{...args,scope:'staging',renderer:config.renderer}});
 if(error)throw Error(error.message);return data;
}
// Request memoization binds page metadata and body to one complete read.
export const readSnapshot=cache(async(edition,digest=null)=>{
 const release=await command('read',{edition,digest});
 validateSnapshot(release.snapshot,baseline,edition);
 return release;
});
