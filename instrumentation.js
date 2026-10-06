export async function register(){
  if(process.env.BRIEF_ENV !== 'staging' && process.env.NEXT_PUBLIC_BRIEF_ENV !== 'staging')return;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async function(input,init){
    const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
    if(url.hostname==='dnzdbqycuuoonewcowis.supabase.co'&&!url.pathname.startsWith('/storage/v1/object/public/')){
      throw new Error('Staging cannot access production database, authentication or functions');
    }
    return originalFetch(input,init);
  };
}
