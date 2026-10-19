import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {managementSession} from '../../../../lib/manage-auth';
import {previewAllowed,quoteFactory} from '../../../../lib/voice-newsroom/config.mjs';
import {PostgresBudget} from '../../../../lib/voice-newsroom/budget.mjs';
import {OpenAIProvider} from '../../../../lib/voice-newsroom/provider.mjs';
import {CAST} from '../../../../lib/voice-newsroom/room.mjs';
import {roomAction,streamTurn} from '../../../../lib/voice-newsroom/handler.mjs';
import {loadCanon} from '../../../../lib/voice-newsroom/canon.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=180;
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>Response.json(body,{status,headers:noStore});
async function gate(request){if(!previewAllowed())return{denied:json({error:'Not found'},404)};const s=await managementSession();if(!s.user||!s.owner)return{denied:json({error:'Owner access required'},403)};if(request.method==='POST'&&request.headers.get('origin')!==new URL(request.url).origin)return{denied:json({error:'Same origin required'},403)};return s;}
function paidConfigured(){try{quoteFactory(process.env.NEWSROOM_COST_POLICY);return !!process.env.NEWSROOM_OPENAI_API_KEY;}catch{return false;}}
async function boundedBody(request,limit){const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);const parts=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('Oversized request');}parts.push(Buffer.from(value));}return Buffer.concat(parts);}
export async function GET(request,{params}){try{const s=await gate(request);if(s.denied)return s.denied;const {action}=await params;
 if(action==='status')return json({mode:paidConfigured()?'live-configured':'offline-rehearsal',paidCallsEnabled:paidConfigured(),privateRemoteAccess:true,capUSD:20,cast:CAST});
 const files={'asset-appjs':'app.js','asset-audiojs':'audio.js','asset-css':'style.css'};if(files[action])return new Response(await readFile(path.join(process.cwd(),'lib/voice-newsroom/ui',files[action]),'utf8'),{headers:{...noStore,'Content-Type':action==='asset-css'?'text/css':'text/javascript'}});
 return json({error:'Not found'},404);
}catch{return json({error:'Private room unavailable'},503);}}
export async function POST(request,{params}){try{const s=await gate(request);if(s.denied)return s.denied;const {action}=await params;
 if(!paidConfigured())return json({error:'Voice connection not activated'},503);
 if(action==='open'){const r=await roomAction(s.db,'open',null);return json({token:r.roomId});}
 const room=request.headers.get('x-room-token');if(!room||!/^[a-f0-9-]{36}$/.test(room))return json({error:'Room required'},400);
 const state=await roomAction(s.db,'read',room);
 if(action==='end'||action==='interrupt'){await roomAction(s.db,action,room,action==='interrupt'?{p_turn:state.currentTurn}:{});return json({ok:true});}
 const provider=new OpenAIProvider({key:process.env.NEWSROOM_OPENAI_API_KEY,budget:new PostgresBudget(s.db,room),quoteFor:quoteFactory(process.env.NEWSROOM_COST_POLICY),enabled:true,privateAccessVerified:true});
 if(action==='transcribe')return json({text:await provider.transcribe(await boundedBody(request,960044),'audio/wav',request.signal)});
 const body=JSON.parse((await boundedBody(request,12000)).toString());
 if(action==='heard'){if(body.index!==0)return json({error:'Invalid playback acknowledgement'},400);await roomAction(s.db,'heard',room,{p_turn:body.turnId});return json({ok:true});}
 if(action!=='turn')return json({error:'Not found'},404);
 const canon=await loadCanon();const cancel=new AbortController();const signal=AbortSignal.any([request.signal,cancel.signal]);
 const stream=new ReadableStream({async start(controller){const emit=e=>controller.enqueue(new TextEncoder().encode(JSON.stringify(e)+'\n'));try{await streamTurn({db:s.db,room,text:body.text,speaker:body.speaker,provider,canon,signal,emit});}catch{try{emit({type:'error',message:'Turn stopped or unavailable; no automatic retry.'});}catch{}}finally{try{controller.close();}catch{}}},cancel(){cancel.abort();}});
 return new Response(stream,{headers:{...noStore,'Content-Type':'application/x-ndjson','X-Accel-Buffering':'no'}});
}catch{return json({error:'Private room request unavailable; no automatic retry'},400);}}
