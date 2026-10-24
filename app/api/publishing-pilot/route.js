import {command} from '../../../lib/publishing-pilot/server';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'};
export async function POST(request){
 const expectedOrigin=process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:process.env.BRIEF_PILOT_ORIGIN;
 if(!expectedOrigin||request.headers.get('origin')!==expectedOrigin)return Response.json({error:'Origin rejected'},{status:403,headers});
 try{
  const raw=await request.text();if(raw.length>20000)throw Error('Request too large');
  const input=JSON.parse(raw);
  // QA and candidate ingestion are deliberately NOT browser publisher capabilities.
  if(!['approve','approve_publish','publish','revoke','status','read'].includes(input.op))throw Error('Unsupported action');
  const data=await command(input.op,input.args||{});return Response.json(data,{headers});
 }catch{return Response.json({state:'recoverable-failure',error:'Pilot request rejected or unavailable. Reconcile status before retrying.'},{status:409,headers});}
}
