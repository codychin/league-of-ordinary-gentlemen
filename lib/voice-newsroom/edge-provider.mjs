// Reconstructed from the 03:21 source-generating tool call. No OpenAI key here.
export class EdgeProvider {
 constructor({url,token,room,fetchImpl=fetch}){Object.assign(this,{url,token,room,fetchImpl});}
 async request(action,body,signal,binary=false){const r=await this.fetchImpl(this.url+'?action='+action,{method:'POST',headers:{Authorization:'Bearer '+this.token,'Content-Type':binary?'audio/wav':'application/json','x-room-token':this.room||''},body:binary?body:JSON.stringify(body),signal});if(!r.ok)throw Error('Private voice service unavailable; no automatic retry');return r;}
}
