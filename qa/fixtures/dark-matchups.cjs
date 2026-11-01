// Explicit LOCAL QA data, never imported by the app or deployed. LOOG uses its
// committed score snapshot; Yahoo editions use labelled synthetic layout records
// because the provider is unavailable in this executor. No live-score claim.
require('./pwa-shell-scores.cjs');
const fetchBeforeFixtures=global.fetch;
global.fetch=async(input,init)=>{
 const url=String(input instanceof Request?input.url:input);
 if(url.endsWith('/rest/v1/rpc/get_public_brief_edition')){
  const slug=JSON.parse(init.body).p_slug;
  const players=[{name:'QA Quarterback',selectedPosition:'QB',points:18,status:'Questionable'}];
  return Response.json({snapshots:{
   rosters:{created_at:'2026-10-31T12:00:00Z',data:{data:[1,2].map(n=>({teamKey:`qa.t.${n}`,teamName:`${slug} QA Team ${n}`,ownerName:`QA Owner ${n}`,players}))}},
   standings:{data:{data:{standings:[1,2].map(teamId=>({teamId,wins:4,losses:3}))}}},
   matchups:{created_at:'2026-10-31T12:00:00Z',data:{data:{matchupWeek:8,matchups:[{home:{teamId:1,points:18},away:{teamId:2,points:21}}]}}}
  }});
 }
 if(url.includes('roster_2026.csv'))return new Response('yahoo_id,headshot_url\n');
 return fetchBeforeFixtures(input,init);
};
