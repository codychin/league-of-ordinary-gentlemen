export const BRANCH='codex/private-voice-newsroom';
export function previewAllowed(env=process.env){return env.VERCEL_ENV==='preview'&&env.VERCEL_GIT_COMMIT_REF===BRANCH;}
export function quoteFactory(raw){
 let config;try{config=JSON.parse(raw||'');}catch{throw Error('Reviewed billing configuration absent');}
 if(config.totalTestCapUSD!==20||!config.verifiedAt)throw Error('Fixed test cap/configuration missing');
 return(kind,meta)=>{const q=config.quotes?.[kind];if(!q?.sourceURL?.startsWith('https://')||!Number.isSafeInteger(q.maximumMicroUSD)||q.maximumMicroUSD<=0||!Number.isFinite(Date.parse(q.expiresAt)))throw Error('Reviewed maximum quote missing');
  if(kind==='reason'&&(!Number.isSafeInteger(q.maxInputBytes)||!Number.isSafeInteger(q.maxOutputTokens)||meta.inputBytes>q.maxInputBytes||meta.maxOutputTokens>q.maxOutputTokens||meta.model!==q.model))throw Error('Reasoning exceeds reviewed model/quote bounds');
  if(kind==='stt'&&(meta.model!==q.model||!Number.isSafeInteger(q.maxAudioBytes)||!Number.isFinite(q.maxSeconds)||meta.bytes>q.maxAudioBytes||meta.maximumSeconds>q.maxSeconds))throw Error('Capture exceeds reviewed quote bounds');
  if(kind==='tts'&&(meta.model!==q.model||!Number.isSafeInteger(q.maxInputBytes)||meta.inputBytes>q.maxInputBytes))throw Error('Speech exceeds reviewed quote bounds');
  return{verified:true,maximumMicroUSD:q.maximumMicroUSD,expiresAt:Date.parse(q.expiresAt)};
 };
}
