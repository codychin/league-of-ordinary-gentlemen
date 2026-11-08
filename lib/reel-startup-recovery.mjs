// Judge startup by an advancing media clock, not by a resolved play promise or
// a 'playing' event. Mobile decoders can report both while stuck on frame one.
export function monitorReelStartup(video,{getMuted=()=>video.muted,onManualRequired=()=>{},onProgress=()=>{},now=()=>performance.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),retryAfterMs=4000,manualAfterMs=8000,pollMs=250}={}){
 let stopped=false,timer=null,retried=false,retryAt=null;const started=now();
 const stop=()=>{stopped=true;if(timer!==null)cancel(timer);};
 const manual=()=>{if(stopped)return;stop();onManualRequired();};
 const tick=()=>{
  if(stopped)return;
  if(video.ended||video.currentTime>.2){stop();onProgress();return;}
  const elapsed=now()-started;
  if((retried&&now()-retryAt>=retryAfterMs)||(!retried&&elapsed>=manualAfterMs)){manual();return;}
  if(!retried&&elapsed>=retryAfterMs&&video.readyState>=2){
   // One reset of the same media element/source. Never silently mute to make
   // a clock assertion pass, seek over content, or create an automatic loop.
   retried=true;retryAt=now();const muted=getMuted();
   try{video.pause();video.load();video.muted=muted;const p=video.play();p?.catch(()=>manual());}catch{manual();}
  }
  if(!stopped)timer=schedule(tick,pollMs);
 };
 timer=schedule(tick,pollMs);return stop;
}
