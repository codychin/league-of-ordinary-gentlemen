'use client';
import {useState} from 'react';
export default function Publisher({digest,generation,preflightReady}){
 const [committed,setCommitted]=useState(false);
 const [status,setStatus]=useState('Preview only'),[requestId]=useState(()=>crypto.randomUUID());
 async function act(op){
  setStatus('publishing');
  try{const r=await fetch('/api/publishing-pilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,args:{digest,expectedGeneration:generation,requestId}})});
   const data=await r.json();setCommitted(data.committed===true);setStatus(r.ok?(data.state||'publishing'):'recoverable failure — reconcile status before retrying');
  }catch{setStatus('recoverable failure — outcome unknown; reconcile status');}
 }
 return <aside><button disabled={!preflightReady} onClick={()=>act('approve_publish')}>Approve and publish</button> <button onClick={()=>act('status')}>Check publication status</button><p role="status" data-committed={committed}>{status}</p><small>Staging only. Verified-live requires independent route verification.</small></aside>;
}
