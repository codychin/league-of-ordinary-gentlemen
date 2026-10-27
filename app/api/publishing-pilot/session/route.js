import {cookies} from 'next/headers';
import {sessionClient,confirmedSession} from '../../../../lib/publishing-pilot/session.mjs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
// Technical bootstrap: an operator supplies an ALREADY authenticated branch session.
// No login UI, identity provisioning, redirect, token response, or admin credential.
export async function POST(request){
 const origin=process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:process.env.BRIEF_PILOT_ORIGIN;
 if(!origin||request.headers.get('origin')!==origin)return Response.json({error:'Origin rejected'},{status:403,headers});
 const writes=[];
 try{
  const raw=await request.text();if(raw.length>33000)throw Error('Too large');
  const input=JSON.parse(raw);if(!['bootstrap','refresh'].includes(input.op))throw Error('Unsupported operation');
  const jar=await cookies();
  const db=sessionClient({getAll:()=>jar.getAll(),setAll:values=>writes.push(...values)});
  await confirmedSession(db,input.op==='bootstrap'?input:null);
  for(const {name,value,options} of writes)jar.set(name,value,options);
  return Response.json({authenticated:true},{headers});
 }catch{return Response.json({error:'Pilot session unavailable'},{status:401,headers});}
}
