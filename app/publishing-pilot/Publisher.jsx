'use client';
import {useEffect,useRef,useState} from 'react';

// Only operation identifiers are persisted, never credentials or unpublished copy.
// The key includes viewer + immutable renderer so another session cannot adopt it.
export default function Publisher({digest,generation,preflightReady,renderer,viewer}){
 const current=useRef(null),mounted=useRef(false),recovering=useRef(false);
 const [state,setState]=useState({label:'Checking saved operation',committed:false});
 const [ready,setReady]=useState(false);
 const key=`brief-pilot-operation-v1:${renderer}:${viewer}`;
 function save(operation){sessionStorage.setItem(key,JSON.stringify(operation));current.current=operation;}
 function show(label,committed=false){if(mounted.current)setState({label,committed});}
 async function request(op,operation){
  const response=await fetch('/api/publishing-pilot',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(7000),body:JSON.stringify({op,args:{digest:operation.digest,expectedGeneration:operation.generation,requestId:operation.requestId}})});
  if(!response.ok)throw Error('Request unavailable');return response.json();
 }
 async function reconcile(){
  const operation=current.current;if(!operation||recovering.current)return;
  recovering.current=true;
  try{
   const result=await request('status',operation);
   if(current.current?.requestId!==operation.requestId)return;
   const label=result.state==='superseded'?'superseded':result.committed?(result.state==='publishing'?'Committed — awaiting verification':result.state):'Recoverable failure — no committed activation found';
   save({...operation,committed:result.committed,state:result.state});show(label,result.committed);
  }catch{show('Recoverable failure — outcome unknown; automatically retrying status',current.current?.committed===true);}
  finally{recovering.current=false;}
 }
 useEffect(()=>{
  mounted.current=true;
  try{
   const saved=JSON.parse(sessionStorage.getItem(key)||'null');
   if(saved&&typeof saved.requestId==='string'&&typeof saved.digest==='string'&&Number.isInteger(saved.generation)){
    current.current=saved;show('Checking saved operation',saved.committed===true);void reconcile();
   }else{current.current=null;show('Preview only');}
   // Verify persistence before accepting an action with an uncertain network outcome.
   sessionStorage.setItem(key,JSON.stringify(current.current));setReady(true);
  }catch{show('Recoverable failure — operation storage unavailable');setReady(false);}
  const timer=setInterval(()=>void reconcile(),1500);
  return()=>{mounted.current=false;clearInterval(timer);};
 },[key]);
 async function publish(retry=false){
  if(!ready)return;
  if(!retry&&current.current&&!['verified-live','superseded'].includes(current.current.state))return;
  const operation=retry?current.current:{digest,generation,requestId:crypto.randomUUID(),state:'sending',committed:false};
  if(!operation)return;
  try{save(operation);}catch{show('Recoverable failure — operation storage unavailable');setReady(false);return;}
  show('publishing',operation.committed===true);
  try{
   const result=await request('approve_publish',operation);
   if(current.current?.requestId!==operation.requestId)return;
   save({...operation,committed:result.committed===true,state:result.state||'publishing'});
   show('Committed — awaiting verification',result.committed===true);
  }catch{show('Checking publication outcome',false);}
  finally{void reconcile();}
 }
 const operation=current.current;
 const uncertain=operation&&!['verified-live','superseded'].includes(operation.state);
 return <aside>
  <button disabled={!ready||!preflightReady||Boolean(uncertain)} onClick={()=>void publish()}>Approve and publish</button>
  {operation?.state==='recoverable-failure'&&!operation.committed&&<button disabled={!ready} onClick={()=>void publish(true)}>Retry same publication</button>}
  <p role="status" aria-live="polite" data-committed={state.committed} data-request-id={operation?.requestId||''}>{state.label}</p>
  {operation&&<small>Operation {operation.requestId} · revision {operation.digest.slice(0,12)}. </small>}
  <small>Staging only. The designated verification runner confirms verified-live; status updates automatically.</small>
 </aside>;
}
