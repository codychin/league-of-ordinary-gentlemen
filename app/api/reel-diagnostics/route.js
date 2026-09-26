export const runtime='edge';

export async function POST(request){
  try{
    const payload=await request.json();
    const safe={
      type:String(payload?.type||'unknown').slice(0,32),
      reel:String(payload?.reel||'').slice(0,64),
      t:String(payload?.t||'').slice(0,16),
      duration:String(payload?.duration||'').slice(0,16),
      readyState:Number(payload?.readyState||0),
      networkState:Number(payload?.networkState||0),
      paused:Boolean(payload?.paused),
      ua:request.headers.get('user-agent')||''
    };
    console.log('[reel-diagnostic]',JSON.stringify(safe));
  }catch{}
  return new Response(null,{status:204});
}
