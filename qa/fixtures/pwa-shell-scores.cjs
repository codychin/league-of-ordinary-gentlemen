// Test-server fixture only: keep the reported historical matchup long enough to
// exercise scrolling even after the live provider advances to another week.
// Loaded explicitly by Release integrity's localhost server, never by the app.
const snapshot=require('../../data/latest-loog-scores.json');
const originalFetch=global.fetch;
global.fetch=async(input,init)=>{
 const url=String(input instanceof Request?input.url:input);
 if(url==='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=scores'){
  return Response.json(snapshot);
 }
 return originalFetch(input,init);
};
