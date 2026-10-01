const supabaseUrl=()=>process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey=()=>process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers=(extra={})=>({
  apikey:serviceKey(),
  Authorization:`Bearer ${serviceKey()}`,
  'Content-Type':'application/json',
  ...extra,
});

export function dbConfigured(){
  return Boolean(supabaseUrl()&&serviceKey());
}

export async function dbInsert(table,row){
  if(!dbConfigured()) throw new Error('Supabase server credentials are not configured');
  const res=await fetch(`${supabaseUrl()}/rest/v1/${table}`,{
    method:'POST',
    headers:headers({Prefer:'return=representation'}),
    body:JSON.stringify(row),
    cache:'no-store',
  });
  if(!res.ok) throw new Error(`DB insert ${table} failed: ${res.status} ${await res.text()}`);
  return (await res.json())[0];
}

export async function dbSelect(table,query=''){
  if(!dbConfigured()) throw new Error('Supabase server credentials are not configured');
  const res=await fetch(`${supabaseUrl()}/rest/v1/${table}?${query}`,{
    headers:headers(),
    cache:'no-store',
  });
  if(!res.ok) throw new Error(`DB select ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
