import { Buffer } from 'node:buffer';
import {OpenAIProvider} from './lib/provider.mjs';
import {PostgresBudget} from './lib/budget.mjs';
import {roomAction,streamTurn} from './lib/handler.mjs';
import {canon} from './canon.mjs';
import {quoteFactory} from './lib/config.mjs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>Response.json(body,{status,headers});
async function readBounded(request,max){const reader=request.body?.getReader();if(!reader)throw Error('Body required');let size=0;const parts=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Body too large');}parts.push(Buffer.from(value));}return Buffer.concat(parts);}
export function voiceHandler({createClient,env,fetchImpl=fetch}){return async request=>{try{
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 const auth=request.headers.get('authorization');if(!auth?.startsWith('Bearer '))return json({error:'Owner required'},403);
 const db=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.auth.getUser(auth.slice(7));if(error||!data?.user?.email_confirmed_at)return json({error:'Owner required'},403);
 const owner=await db.rpc('brief_manage_is_owner');if(owner.error||owner.data!==true)return json({error:'Owner required'},403);
 const action=new URL(request.url).searchParams.get('action');
 if(!['readiness','status','open','end','interrupt','heard','transcribe','turn'].includes(action))return json({error:'Not found'},404);

 // Owner-only no-generation diagnostic. Returns model availability, never credentials.
 if(action==='readiness'){
  const key=env('OPENAI_API_KEY');if(!key)return json({configured:false,reason:'Existing provider unavailable'},503);
  const models=['gpt-4.1-mini','gpt-4o-mini-transcribe','tts-1-hd'];const available={};
  for(const model of models){
   const r=await fetchImpl('https://api.openai.com/v1/models/'+encodeURIComponent(model),{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000)});
   available[model]=r.ok;await r.body?.cancel();
  }
  return json({models:available,paidCallsEnabled:env('NEWSROOM_VOICE_ENABLED')==='true',accountTariffVerified:false});
 }
 // Stopping, deleting and acknowledging existing rooms never require paid readiness.
 if(['end','interrupt','heard'].includes(action)){
  const room=request.headers.get('x-room-token');if(!room||!/^[a-f0-9-]{36}$/.test(room))return json({error:'Room required'},400);
  if(action==='end'){await roomAction(db,'end',room);return json({ok:true});}
  const state=await roomAction(db,'read',room);
  if(action==='heard'){const body=JSON.parse((await readBounded(request,12000)).toString());if(body.index!==0)return json({error:'Invalid acknowledgement'},400);await roomAction(db,'heard',room,{p_turn:body.turnId});}
  else await roomAction(db,action,room,action==='interrupt'?{p_turn:state.currentTurn}:{});
  return json({ok:true});
 }
 if(env('NEWSROOM_VOICE_ENABLED')!=='true')return json({error:'Voice not activated'},503);
 const quoteFor=quoteFactory(env('NEWSROOM_COST_POLICY'));const key=env('OPENAI_API_KEY');if(!key)return json({error:'Provider unavailable'},503);
 // All quote dimensions validated at maximum supported size, without spending.
 for(const [kind,meta] of [['reason',{model:'gpt-4.1-mini',inputBytes:180000,maxOutputTokens:200}],['stt',{model:'gpt-4o-mini-transcribe',bytes:960044,maximumSeconds:30}],['tts',{model:'tts-1-hd',inputBytes:8000,maximumCharacters:2000}]]){const q=quoteFor(kind,meta);if(q.expiresAt<=Date.now())throw Error('Expired pricing');}
 const health=await db.rpc('brief_voice_room',{p_action:'status'});if(health.error||health.data?.capMicroUsd!==20000000||!Number.isSafeInteger(health.data?.reservedMicroUsd)||health.data.reservedMicroUsd>=20000000)return json({error:'Voice budget unavailable'},503);
 if(action==='status')return json({configured:true,reservedMicroUsd:health.data.reservedMicroUsd,capUSD:20});
 if(action==='open'){const r=await roomAction(db,'open',null);return json({token:r.roomId});}
 const room=request.headers.get('x-room-token');if(!room||!/^[a-f0-9-]{36}$/.test(room))return json({error:'Room required'},400);
 const state=await roomAction(db,'read',room);
 const provider=new OpenAIProvider({key,budget:new PostgresBudget(db,room),quoteFor,fetchImpl,enabled:true,privateAccessVerified:true});
 if(action==='transcribe')return json({text:await provider.transcribe(await readBounded(request,960044),'audio/wav',request.signal)});
 const body=JSON.parse((await readBounded(request,12000)).toString());
 const cancel=new AbortController();const signal=AbortSignal.any([request.signal,cancel.signal]);
 let runningTurn=null;const monitoredProvider={bindTurn(turn){runningTurn=turn;provider.bindTurn(turn);},reason:provider.reason.bind(provider),speech:provider.speech.bind(provider)};
 const poll=setInterval(async()=>{if(!runningTurn||signal.aborted)return;try{const r=await roomAction(db,'read',room);if(r.currentTurn!==runningTurn)cancel.abort();}catch{cancel.abort();}},500);
 const stream=new ReadableStream({async start(controller){const emit=e=>controller.enqueue(new TextEncoder().encode(JSON.stringify(e)+'\n'));try{await streamTurn({db,room,text:body.text,speaker:body.speaker,provider:monitoredProvider,canon,signal,emit});}catch{try{emit({type:'error',message:'Turn stopped or unavailable; no automatic retry.'});}catch{}}finally{clearInterval(poll);try{controller.close();}catch{}}},cancel(){cancel.abort();clearInterval(poll);}});
 return new Response(stream,{headers:{...headers,'Content-Type':'application/x-ndjson'}});
 }catch{return json({error:'Private voice request unavailable; no automatic retry'},400);}};}
