// Isolated component-render QA. Uses the actual matchup components and selector,
// but supplies labelled local provider fixtures. This is not live-route evidence.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {renderToStaticMarkup} from 'react-dom/server';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
export const week9Columns=read('data/week9-matchup-columns.json');
export const week9Recaps=read('data/matchup-recaps.json').filter(c=>c.week===9&&c.season===2026&&c.kind==='recap');
export const teamSlugs={1:'kupp-doubs',2:'danir',3:'all-ugly',4:'route-22',5:'skatt',6:'pollard-greens',7:'hopkins-opus',8:'shake-baker',9:'kraft',10:'royrek',11:'lloyd-rings',12:'ceedeep'};
export const matchupPath=c=>(c.edition==='loog'?`/matchups/${teamSlugs[c.teamIds[0]]}/${teamSlugs[c.teamIds[1]]}`:`/${c.edition}/matchups/${c.teamIds.join('/')}`)+'?week=9';
export const recapFor=c=>week9Recaps.find(r=>r.edition===c.edition&&r.teamIds.length===2&&c.teamIds.every(id=>r.teamIds.map(String).includes(String(id))));
const cache=new Map();
function fixtureData(phase){
 if(!['pregame','final'].includes(phase))throw Error('Unknown fixture phase');
 const final=phase==='final',evidence=read('data/week9-loog-final-evidence.json');
 const loog={ok:true,season:2026,week:9,updatedAt:'2026-11-10T10:00:00Z',matchups:evidence.matchups.map(g=>({status:final?'FINAL':'PREGAME',winner:final?g.winner:'UNDECIDED',home:{id:g.home.teamId,score:final?g.home.totalPoints:0},away:{id:g.away.teamId,score:final?g.away.totalPoints:0}}))};
 const editions={};
 for(const slug of ['sunday-crew','doge']){
  // Synthetic Yahoo records exercise finality and rendering, not provider accuracy.
  const pairs=week9Columns.filter(c=>c.edition===slug).map(c=>c.teamIds.map(Number));
  editions[slug]={snapshots:{
   rosters:{created_at:'2026-11-10T10:00:00Z',data:{data:Array.from({length:12},(_,i)=>({teamKey:`qa.t.${i+1}`,teamName:`${slug} QA Team ${i+1}`,ownerName:`QA Owner ${i+1}`,players:[{name:'QA Quarterback',selectedPosition:'QB',points:final?18:0}]}))}},
   standings:{data:{data:{standings:Array.from({length:12},(_,i)=>({teamId:i+1,wins:4,losses:5}))}}},
   matchups:{created_at:'2026-11-10T10:00:00Z',data:{data:{matchupWeek:9,matchups:pairs.map(([a,b])=>({status:final?'FINAL':'PREGAME',winner:final?'HOME':'UNDECIDED',home:{teamId:a,points:final?100:0},away:{teamId:b,points:final?90:0}}))}}}
  }};
 }
 return {loog,editions};
}
async function compiled(phase){
 if(cache.has(phase))return cache.get(phase);
 const data=fixtureData(phase),prior=read('data/week8-loog-snapshot.json');
 const snapshot={...prior,week:9};
 const json={
  'latest-loog-scores.json':data.loog,'completed-loog-scores.json':data.loog,
  'week6-loog-closeout.json':{week:6,loog:{details:[]}},
  '02-rosters-1-4.json':{rosters:[]},'03-rosters-5-8.json':{rosters:[]},'04-rosters-9-12.json':{rosters:[]},
  'week6-matchup-columns.json':[],'week7-matchup-columns.json':[]
 };
 const result=await build({stdin:{contents:"export {default as loog} from './app/matchups/[a]/[b]/page.js'; export {default as yahoo} from './app/components/editions/Matchup.js';",resolveDir:root,loader:'js'},absWorkingDir:root,bundle:true,write:false,platform:'node',format:'cjs',packages:'external',jsx:'automatic',loader:{'.js':'jsx'},plugins:[{name:'local-matchup-fixtures',setup(b){
  b.onResolve({filter:/.*/},args=>{
   let key;
   if(args.path==='next/link')key='link';
   else if(args.path==='next/navigation')key='navigation';
   else if(/\/(?:EditionSiteNav|SiteNav)$/.test(args.path))key='nav';
   else if(/\/teams\/league-data(?:\.js)?$/.test(args.path))key='league';
   else if(/\/teams\/data(?:\.js)?$/.test(args.path))key='teams';
   else if(/\/lib\/edition-data(?:\.js)?$/.test(args.path))key='edition';
   else if(Object.hasOwn(json,path.basename(args.path)))key='json:'+path.basename(args.path);
   return key?{path:key,namespace:'matchup-fixture'}:undefined;
  });
  b.onLoad({filter:/.*/,namespace:'matchup-fixture'},args=>{
   let contents;
   if(args.path==='link')contents="import React from 'react'; export default function Link({children,prefetch,replace,scroll,...props}){return React.createElement('a',props,children)}";
   else if(args.path==='navigation')contents="export function notFound(){throw Error('Fixture reached notFound')}";
   else if(args.path==='nav')contents="export default function Nav(){return null}";
   else if(args.path==='league')contents='export const leagueSnapshot='+JSON.stringify(snapshot);
   else if(args.path==='teams')contents='export const teams='+JSON.stringify(Object.entries(snapshot.teams).map(([id,t])=>({id,team:t.teamName,owners:'QA owner'})));
   else if(args.path==='edition')contents='const data='+JSON.stringify(data.editions)+'; export async function getEditionData(slug){return data[slug]} export async function getNflHeadshotsByYahooId(){return {}}';
   else contents='export default '+JSON.stringify(json[args.path.slice(5)]);
   return {contents,loader:'js',resolveDir:root};
  });
 }}]});
 const module={exports:{}};
 new Function('require','module','exports',result.outputFiles[0].text)(createRequire(path.join(root,'package.json')),module,module.exports);
 const value={components:module.exports,data};cache.set(phase,value);return value;
}
export async function renderWeek9Matchup(c,phase){
 const {components,data}=await compiled(phase),previous=globalThis.fetch;
 globalThis.fetch=async input=>{
  const url=String(input instanceof Request?input.url:input);
  if(url==='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-sunday-engine?action=scores')return Response.json(data.loog);
  throw Error('Unexpected external fetch in isolated matchup fixture: '+url);
 };
 try{
  const [a,b]=c.teamIds.map(String),loog=c.edition==='loog';
  const props={params:Promise.resolve({a:loog?teamSlugs[a]:a,b:loog?teamSlugs[b]:b}),searchParams:Promise.resolve({week:'9'}),config:{root:'/'+c.edition,name:c.edition,slug:c.edition,publicationName:'QA edition'}};
  return renderToStaticMarkup(await (loog?components.loog:components.yahoo)(props));
 }finally{globalThis.fetch=previous;}
}
