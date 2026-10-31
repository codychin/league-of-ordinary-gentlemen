// LOCAL browser QA only: complete the labelled edition shell around real published
// preview records. No provider/team/score data in this fixture is claimed as live.
require('./dark-matchups.cjs');
const previous=global.fetch;
global.fetch=async(input,init)=>{
 const url=String(input instanceof Request?input.url:input);
 if(url.endsWith('/rest/v1/rpc/get_public_brief_articles'))return Response.json([]);
 if(url.endsWith('/rest/v1/rpc/get_public_brief_edition')){
  const slug=JSON.parse(init.body).p_slug;
  return Response.json({league:{id:`qa-${slug}`,name:`${slug} QA league`},tenant:{publication_name:`The Brief — ${slug} QA`},snapshots:{}});
 }
 return previous(input,init);
};
