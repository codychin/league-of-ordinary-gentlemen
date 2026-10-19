import { Buffer } from 'node:buffer';
import {CAST} from './room.mjs';
export async function roomAction(db,action,room,args={}){const {data,error}=await db.rpc('brief_voice_room',{p_action:action,p_room:room,...args});if(error)throw Error('Room action unavailable or no longer current');return data;}
export async function streamTurn({db,room,text,speaker,provider,canon,signal,emit}){
 if(!CAST[speaker]||typeof text!=='string'||!text.trim()||text.length>10000)throw Error('Valid participant and text required');
 const claim=await roomAction(db,'claim',room,{p_speaker:speaker,p_text:text});const turn=claim.turnId;provider.bindTurn?.(turn);
 const current=async()=>{signal.throwIfAborted();const r=await roomAction(db,'read',room);if(r.currentTurn!==turn)throw Error('Turn interrupted');};
 try{
  const reply=await provider.reason({persona:CAST[speaker].brief,canon,transcript:claim.transcript,instruction:'Only heard transcript is shared. Speak only as yourself. No publishing, external actions, invented facts or compulsory agreement. Cody controls approval.'},signal);
  await current();await roomAction(db,'stage',room,{p_turn:turn,p_speaker:speaker,p_text:reply});emit({type:'start',turnId:turn,speaker,text:reply});
  let checked=Date.now();for await(const chunk of provider.speech(reply,speaker,signal)){signal.throwIfAborted();if(Date.now()-checked>500){await current();checked=Date.now();}emit({type:'audio',data:Buffer.from(chunk).toString('base64')});}
  await current();emit({type:'done',turnId:turn,index:0});
 }catch(e){try{await roomAction(db,'interrupt',room,{p_turn:turn});}catch{}throw e;}
}
