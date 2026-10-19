import { randomUUID } from 'node:crypto';
import { guardedProviderCall } from './budget.mjs';
import { normalizeCapture } from './audio-input.mjs';
export const VOICES = Object.freeze({rika:'coral',maude:'sage',hollis:'ash',marnie:'shimmer'});
// Stock voice choices are candidates, not an approved audition or exact cast match.
export class OpenAIProvider {
 constructor({key,budget,quoteFor,fetchImpl=fetch,enabled=false,privateAccessVerified=false,model='gpt-4.1-mini',normalizeAudio=normalizeCapture}) {
  Object.assign(this,{key,budget,quoteFor,fetchImpl,enabled,privateAccessVerified,model,normalizeAudio});
 }
 bindTurn(turn){this.budget.turn=turn;}
 async call(kind,path,body,signal,meta,form=false) {
  if(!this.key) throw Error('Authorized provider credential missing');
  signal=AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(60000)]);
  const quote=this.quoteFor?.(kind,meta);
  return guardedProviderCall({enabled:this.enabled,privateAccessVerified:this.privateAccessVerified,quote,budget:this.budget,id:randomUUID(),signal,operation:async()=>{
   const response=await this.fetchImpl('https://api.openai.com/v1/'+path,{method:'POST',headers:{Authorization:`Bearer ${this.key}`,...(!form?{'Content-Type':'application/json'}:{})},body:form?body:JSON.stringify(body),signal});
   if(!response.ok) throw Error(`Provider ${kind} failed (${response.status}); no automatic retry`);
   return response;
  }});
 }
 async transcribe(bytes,type,signal) {
  if(!['audio/webm','audio/mp4','audio/wav','audio/ogg'].some(t=>type.startsWith(t))||bytes.length>2_000_000||!bytes.length) throw Error('Unsupported or oversized microphone capture');
  const normalized=await this.normalizeAudio(bytes,signal);
  if(!Number.isFinite(normalized.seconds)||normalized.seconds<=0||normalized.seconds>30)throw Error('Invalid capture duration');
  bytes=normalized.bytes;type='audio/wav';
  const form=new FormData(); form.set('model','gpt-4o-mini-transcribe');form.set('response_format','json');
  const ext=type.startsWith('audio/mp4')?'mp4':type.startsWith('audio/ogg')?'ogg':type.startsWith('audio/wav')?'wav':'webm';
  form.set('file',new Blob([bytes],{type}),`utterance.${ext}`);
  const r=await this.call('stt','audio/transcriptions',form,signal,{bytes:bytes.length,maximumSeconds:normalized.seconds,model:'gpt-4o-mini-transcribe'},true);const j=await r.json();
  if(typeof j.text!=='string'||j.text.length>10000)throw Error('Invalid transcription');return j.text;
 }
 async reason(context,signal) {
  const instructions=context.persona+'\n'+context.instruction+'\n'+context.canon+'\nReply in at most 80 words. One contribution, no forced punchline. Say you have nothing to add when appropriate. Never impersonate the other participants.';
  const input=JSON.stringify(context.transcript);
  if(Buffer.byteLength(instructions+input)>180000)throw Error('Room context limit reached; end and start a new room');
  const body={model:this.model,instructions,input,max_output_tokens:200,store:false,service_tier:'default'};
  const r=await this.call('reason','responses',body,signal,{inputBytes:Buffer.byteLength(instructions+input),maxOutputTokens:200,model:this.model});const j=await r.json();
  const text=(j.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('').trim();
  if(!text||text.length>2000)throw Error('Empty or oversized model reply');return text;
 }
 async *speech(text,speaker,signal) {
  if(!VOICES[speaker]||text.length>2000)throw Error('Invalid speech request');
  const body={model:'tts-1-hd',voice:VOICES[speaker],input:text.replace(/\bDoubs\b/g,'Dobbs').replace(/\bTetairoa McMillan\b/g,'Tet McMillan'),response_format:'pcm',stream_format:'audio'};
  const r=await this.call('tts','audio/speech',body,signal,{inputBytes:Buffer.byteLength(body.input),maximumCharacters:2000,model:'tts-1-hd'});
  let size=0,carry=Buffer.alloc(0);for await(const chunk of r.body){size+=chunk.length;if(size>4_800_000)throw Error('Speech output limit reached');if(signal.aborted)throw Error('Cancelled');const bytes=Buffer.concat([carry,Buffer.from(chunk)]);const even=bytes.length-(bytes.length%2);if(even)yield bytes.subarray(0,even);carry=bytes.subarray(even);}
  if(carry.length)throw Error('Truncated PCM sample');
 }
}
