const invalid=()=>{throw Error('Invalid public Brief snapshot');};
const string=(v,max=100000)=>{if(typeof v!=='string'||v.length>max)invalid();};
const list=(v,max=2000)=>{if(!Array.isArray(v)||v.length>max)invalid();return v;};
const slug=v=>typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
function link(v,relative=false){
 if(relative&&typeof v==='string'&&v.startsWith('/')&&!v.startsWith('//')&&!v.includes('\\'))return;
 try{const u=new URL(v);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)invalid();}catch{invalid();}
}
function publicTree(v,depth=0){
 if(depth>35)invalid();
 if(!v||typeof v!=='object')return;
 for(const [k,x] of Object.entries(v)){
  if(['league_id','leagueId','edition','editions','__proto__','constructor','prototype','html'].includes(k))invalid();
  if(k==='scope'&&(x?.kind!=='global'||Object.keys(x).length!==1))invalid();
  if(['image','src','poster','fallbackPoster','url','href'].includes(k)&&x!==null)link(x,true);
  publicTree(x,depth+1);
 }
}
function rich(nodes){for(const n of list(nodes,1000)){
 if(typeof n.text==='string'){string(n.text);continue;}
 if(!['a','em','strong','small','span','br','b','i'].includes(n.kind))invalid();
 if(n.kind==='a')link(n.url);rich(n.children);
}}
function block(b){
 string(b.id,100);
 switch(b.type){
 case 'paragraph':case 'statistic':case 'heading':string(b.text);break;
 case 'rich':rich(b.nodes);break;
 case 'image':link(b.src,true);string(b.alt);if(b.aspectRatio!==null&&b.aspectRatio!==undefined&&!(b.aspectRatio>0&&b.aspectRatio<100))invalid();break;
 case 'external':if(!/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(b.url)||b.offline!==false)invalid();string(b.title);break;
 case 'xclip':if(!/^\d+$/.test(b.tweetId))invalid();link(b.url);break;
 case 'break':break;
 default:invalid();
 }
}
export function validateLiveSnapshot(feed){
 if(feed?.version!==2||feed.complete!==true||feed.scope?.kind!=='global'||!Number.isSafeInteger(feed.publishedAt)||feed.publishedAt<=0||!/^[a-f0-9]{64}$/.test(feed.revision))invalid();
 publicTree(feed);
 const cards=list(feed.cards),readers=list(feed.readers),ids=new Set();
 for(const c of cards){
  if(!slug(c.slug)||ids.has(c.slug)||c.href!==`/articles/${c.slug}`||c.scope?.kind!=='global'||c.nativeReader!==true||!Number.isFinite(c.timestamp))invalid();
  ids.add(c.slug);for(const k of ['title','dek','by','section','imageAlt'])string(c[k]);
  if(!c.title||!c.by)invalid();if(c.image!==null)link(c.image,true);
 }
 if(readers.length!==cards.length)invalid();
 const seen=new Set();
 for(const r of readers){
  if(!ids.has(r.slug)||seen.has(r.slug)||!['normal','first','hidden'].includes(r.heroMode))invalid();seen.add(r.slug);
  const c=cards.find(c=>c.slug===r.slug);
  for(const k of Object.keys(c))if(JSON.stringify(c[k])!==JSON.stringify(r[k]))invalid();
  const bs=list(r.blocks,1000);if(new Set(bs.map(b=>b.id)).size!==bs.length)invalid();bs.forEach(block);
  if(r.media&&!['video','xclip','instagram'].includes(r.media.type))invalid();
 }
 if(feed.reader!==null){const r=readers.find(r=>r.slug===feed.reader?.slug);if(!r||JSON.stringify(r)!==JSON.stringify(feed.reader))invalid();}
 const homeIds=new Set();
 for(const m of list(feed.home,200)){
  if(!['lead','carousel','feature','assignment'].includes(m.kind))invalid();
  for(const c of list(m.cards,100)){if(!ids.has(c.slug)||homeIds.has(c.slug))invalid();homeIds.add(c.slug);}
 }
 const cultureIds=new Set();for(const c of list(feed.culture)){
  if(!ids.has(c.slug)||cultureIds.has(c.slug))invalid();cultureIds.add(c.slug);
  for(const k of ['title','dek','tag'])string(c[k]);
 }
 const videoIds=new Set();for(const v of list(feed.watch,500)){
  if(typeof v.id!=='string'||videoIds.has(v.id)||v.scope?.kind!=='global'||v.offline!==false)invalid();videoIds.add(v.id);link(v.src,true);link(v.poster,true);string(v.title);string(v.correspondent);
 }
 if(!feed.presentation||typeof feed.presentation!=='object'||Array.isArray(feed.presentation))invalid();
 for(const [id,p] of Object.entries(feed.presentation)){
  if(!ids.has(id))invalid();string(p.writer?.name);string(p.writer?.role);link(p.writer.image,true);
  if(p.overlay){string(p.overlay.byline);string(p.overlay.theme);}
  if(p.framing&&(!Number.isFinite(p.framing.x)||!Number.isFinite(p.framing.y)||!['cover','contain'].includes(p.framing.fit)))invalid();
 }
 return feed;
}
