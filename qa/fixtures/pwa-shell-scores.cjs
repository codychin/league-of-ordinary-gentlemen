// Test-server fixture only: pin the committed score week independently of the live
// provider. Navigation tests assert its real published or awaiting-publication state.
// Loaded explicitly by Release integrity's localhost server, never by the app.
const stored=require('../../data/latest-loog-scores.json');
// Match the hosted legacy endpoint shape, including its missing season field.
// A newer fixture timestamp ensures the consumer exercises provider selection.
const snapshot={ok:true,source:stored.source,week:stored.week,updatedAt:new Date(Date.parse(stored.updatedAt)+1000).toISOString(),matchups:stored.matchups};
const originalFetch=global.fetch;
global.fetch=async(input,init)=>{
 const url=String(input instanceof Request?input.url:input);
 if(url==='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=scores'){
  return Response.json(snapshot);
 }
 return originalFetch(input,init);
};
