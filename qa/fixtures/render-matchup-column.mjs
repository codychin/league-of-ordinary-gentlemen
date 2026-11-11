// QA-only dependency fixtures render the unchanged production route components.
// No server preloads or application imports reference this module.
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {renderToStaticMarkup} from 'react-dom/server';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../package.json',import.meta.url));
export const slugs={1:'kupp-doubs',2:'danir',3:'all-ugly',4:'route-22',5:'skatt',6:'pollard-greens',7:'hopkins-opus',8:'shake-baker',9:'kraft',10:'royrek',11:'lloyd-rings',12:'ceedeep'};
export async function renderMatchupColumn(c,{final=false,recaps=[]}={}){
 const ids=c.teamIds.map(Number),edition=c.edition;
 const snapshot={ok:true,season:2026,week:c.week,updatedAt:'2099-01-01T00:00:00Z',matchups:[{winner:final?'HOME':'UNDECIDED',status:final?'FINAL':'PREGAME',home:{id:ids[0],score:final?120:0},away:{id:ids[1],score:final?100:0}}]};
 const yahoo={snapshots:{rosters:{data:{data:ids.map(id=>({teamKey:'fixture.t.'+id,teamName:'Fixture team '+id,ownerName:'Fixture owner',players:[]}))}},standings:{data:{data:{standings:[]}}},matchups:{data:{data:{matchupWeek:c.week,matchups:[{status:final?'FINAL':'PREGAME',winner:final?'HOME':'UNDECIDED',home:{teamId:ids[0],points:final?120:0},away:{teamId:ids[1],points:final?100:0}}]}}}}};
 const result=await build({absWorkingDir:root,entryPoints:[edition==='loog'?'app/matchups/[a]/[b]/page.js':'app/components/editions/Matchup.js'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.js':'jsx'},jsx:'automatic',define:{fetch:'fixtureFetch'},banner:{js:'const fixtureFetch=async()=>Response.json({ok:false});'},plugins:[{name:'explicit-qa-data',setup(b){
  b.onResolve({filter:/^(next\/link|next\/navigation)$|(?:SiteNav|edition-data|latest-loog-scores\.json|completed-loog-scores\.json|matchup-recaps\.json)$/},a=>({path:a.path,namespace:'qa'}));
  b.onLoad({filter:/.*/,namespace:'qa'},a=>{
   let contents;
   if(a.path==='next/link')contents=`import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`;
   else if(a.path==='next/navigation')contents=`export function notFound(){throw new Error('Fixture route unexpectedly not found')}`;
   else if(a.path.endsWith('SiteNav'))contents='export default function Nav(){return null}';
   else if(a.path.endsWith('edition-data'))contents=`export async function getEditionData(){return ${JSON.stringify(yahoo)}};export async function getNflHeadshotsByYahooId(){return {}}`;
   else contents='export default '+JSON.stringify(a.path.endsWith('matchup-recaps.json')?recaps:snapshot);
   return {contents,loader:'js',resolveDir:root};
  });
 }}]});
 const module={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);
 const params={a:edition==='loog'?slugs[ids[0]]:String(ids[0]),b:edition==='loog'?slugs[ids[1]]:String(ids[1])};
 return renderToStaticMarkup(await module.exports.default({params:Promise.resolve(params),searchParams:Promise.resolve({}),config:{root:'/'+edition,name:edition,slug:edition,publicationName:'QA fixture'}}));
}
