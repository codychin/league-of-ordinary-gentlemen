import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {authConfig,managementSession} from '../../../../lib/manage-auth';
import {previewAllowed} from '../../../../lib/voice-newsroom/config.mjs';
import {EdgeProvider} from '../../../../lib/voice-newsroom/edge-provider.mjs';

import {CAST} from '../../../../lib/voice-newsroom/room.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=180;
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>Response.json(body,{status,headers:noStore});
async function gate(request){if(!previewAllowed())return{denied:json({error:'Not found'},404)};const s=await managementSession();if(!s.user||!s.owner)return{denied:json({error:'Owner access required'},403)};if(request.method==='POST'&&request.headers.get('origin')!==new URL(request.url).origin)return{denied:json({error:'Same origin required'},403)};return s;}
async function edgeProvider(s,room){const {data,error}=await s.db.auth.getSession();if(error||!data?.session?.access_token)throw Error('Owner session unavailable');return new EdgeProvider({url:authConfig().url+'/functions/v1/brief-voice-room',token:data.session.access_token,room});}
async function boundedBody(request,limit){const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);const parts=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('Oversized request');}parts.push(Buffer.from(value));}return Buffer.concat(parts);}
export async function GET(request,{params}){try{const s=await gate(request);if(s.denied)return s.denied;const {action}=await params;
 if(action==='readiness'){const p=await edgeProvider(s,null);const r=await p.request('readiness',{},request.signal);return json(await r.json(),r.status);}
 if(action==='status'){let ready=false;try{const p=await edgeProvider(s,null);const r=await p.request('status',{},request.signal);ready=(await r.json()).configured===true;}catch{}return json({mode:ready?'live-configured':'offline-rehearsal',paidCallsEnabled:ready,privateRemoteAccess:true,capUSD:20,cast:CAST});}
 const files={'asset-appjs':'app.js','asset-audiojs':'audio.js','asset-css':'style.css'};if(files[action])return new Response(await readFile(path.join(process.cwd(),'lib/voice-newsroom/ui',files[action]),'utf8'),{headers:{...noStore,'Content-Type':action==='asset-css'?'text/css':'text/javascript'}});
 return json({error:'Not found'},404);
}catch{return json({error:'Private room unavailable'},503);}}
export async function POST(request,{params}){try{const s=await gate(request);if(s.denied)return s.denied;const {action}=await params;
 if(!['open','end','interrupt','heard','transcribe','turn'].includes(action))return json({error:'Not found'},404);
 const provider=await edgeProvider(s,request.headers.get('x-room-token'));
 const bytes=await boundedBody(request,action==='transcribe'?960044:12000);
 const response=await provider.request(action,action==='transcribe'?bytes:JSON.parse(bytes.toString()||'{}'),request.signal,action==='transcribe');
 return new Response(response.body,{status:response.status,headers:{...noStore,'Content-Type':response.headers.get('Content-Type')||'application/json'}});
}catch{return json({error:'Private room unavailable; no automatic retry'},503);}}
