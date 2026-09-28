import {buildPacket} from './packet.ts'
import {editorialMeeting,selectPitch,writePost} from './model.ts'
import {leagueObservations} from './league.ts'
import {rank,redundant} from './editorial.ts'
import {publishable} from './quality.ts'
import {recentMemory,remember} from './memory.ts'
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
const LEAGUE='310731',SEASON=2026
const db=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json=(x:any,s=200)=>Response.json(x,{status:s,headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'}})
const fmt=(n:any)=>Number(n||0).toFixed(1)
const voices=['gannon','pike','crane','kells','march','sorrell']
const tags:any={gannon:'SCOREBOARD READ',pike:'MARKET MOVE',crane:'EVIDENCE DESK',kells:'ROOM TONE',march:'SUNDAY WIRE',sorrell:'SCOREBOARD'}
const extSources=[
 'https://www.espn.com/espn/rss/nfl/news',
 'https://www.nfl.com/news/series/nfl-news-roundup'
]
const decode=(s:string)=>s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim()
const cleanSummary=(s:string)=>{const x=decode(s||'');return x.replace(/Our NFL Nation reporters[\s\S]*$/i,'').replace(/Our reporters react[\s\S]*$/i,'').replace(/Here(?:’|'|’)s what we learned[\s\S]*$/i,'').replace(/\b(?:QB|RB|WR|TE|K|DST|D\/ST)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,'$1').trim()}
async function externalWire(){
 const items:any[]=[]
 try{
  const x=await (await fetch(extSources[0],{headers:{'User-Agent':'Mozilla/5.0'}})).text()
  for(const m of x.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/gi)) items.push({title:decode(m[1]),summary:cleanSummary(m[2]),url:decode(m[3]),source:'ESPN'})
 }catch{}
 try{
  const board=await (await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard')).json()
  for(const ev of board?.events||[]) for(const h of ev?.competitions?.[0]?.headlines||[]) items.push({title:h.shortLinkText||h.description||'',summary:cleanSummary(h.description||''),url:h.links?.[0]?.href||'',source:'ESPN LIVE'})
 }catch{}
 return items.filter(x=>x.title).slice(0,80)
}
async function maudeAnalytics(){
 const out:any[]=[]
 try{
  const board=await (await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',{headers:{Accept:'application/json'}})).json()
  for(const ev of board?.events||[]){
   if(!['in','post'].includes(ev?.status?.type?.state))continue
   try{
    const s=await (await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event='+ev.id,{headers:{Accept:'application/json'}})).json()
    for(const team of s?.boxscore?.players||[]) for(const group of team?.statistics||[]) for(const row of group?.athletes||[]){
     const a=row?.athlete||{},stats=(row?.stats||[]).map((x:any)=>String(x)),name=a?.displayName||a?.shortName,label=String(group?.name||group?.type||group?.displayName||'').toLowerCase()
     if(!name||!stats.length)continue
     let subject='',text='',score=0
     if(label.includes('receiv')){const rec=Number(stats[0]),yds=Number(stats[1]),td=Number(stats[3]),tgts=Number(stats[4]);if(Number.isFinite(tgts)&&tgts>=8){score=tgts+(yds||0)/20;subject=name+' is forcing the target tree to bend';text=name+' has '+tgts+' targets for '+(Number.isFinite(rec)?rec:0)+' catches and '+(Number.isFinite(yds)?yds:0)+' yards'+(Number.isFinite(td)&&td?' with '+td+' receiving TDs':'')+'. The opportunity count is the signal: this offense is repeatedly choosing that matchup, which matters more going forward than whether today also produced a touchdown.'}}
     else if(label.includes('rush')){const car=Number(stats[0]),yds=Number(stats[1]),td=Number(stats[3]);if(Number.isFinite(car)&&car>=18){score=car+(yds||0)/25;subject=name+' has become the game script';text=name+' has '+car+' carries for '+(Number.isFinite(yds)?yds:0)+' yards'+(Number.isFinite(td)&&td?' and '+td+' rushing TDs':'')+'. '+car+' carries is the actionable number: the offense is expressing its preferred game state through him, a workload signal that is more stable than the touchdown column.'}}
     else if(label.includes('pass')){const ca=stats[0]||'',yds=Number(stats[1]),td=Number(stats[3]),ints=Number(stats[4]),att=Number(ca.split('/')[1]||'');if(Number.isFinite(att)&&att>=30){score=att/3+(yds||0)/40;subject=name+' is telling us what kind of game this became';text=name+' has thrown '+att+' passes for '+(Number.isFinite(yds)?yds:0)+' yards'+(Number.isFinite(td)?', '+td+' TDs':'')+(Number.isFinite(ints)?' and '+ints+' INTs':'')+'. The attempt volume is the first clue: separate what the quarterback created from what the game script demanded before treating the box score as a change in talent.'}}
     if(text)out.push({writer:'gannon',tag:'MAUDE — LIVE ANALYTICS',subject,text,thread:'NERD BALL',story_key:'maude:'+ev.id+':'+String(a.id||name).toLowerCase().replace(/[^a-z0-9]+/g,'-')+':'+label,score})
    }
   }catch{}
  }
 }catch{}
 return out.sort((a,b)=>b.score-a.score)
}
const keyOf=(item:any)=>{try{const u=new URL(item.url);return (u.hostname+u.pathname).toLowerCase().replace(/\/$/,'')}catch{return item.title.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().slice(0,140)}}
function assignStory(item:any,leagueGames:any[],recent:any[]){
 item={...item,title:cleanSummary(String(item.title??'')),summary:cleanSummary(String(item.summary??''))};const t=(item.title+' '+item.summary).toLowerCase()
 const injury=/injur|questionable|ruled out|hamstring|knee|ankle|concussion/.test(t),qb=/quarterback|\bqb\b|drake maye|caleb williams|jameis|burrow|herbert/.test(t),labor=/workload|touches|contract|trade|signing|roster|practice squad|salary/.test(t),culture=/brazil|international|celebr|fans|viral|record|historic/.test(t),chaos=/turnover|fumble|collapse|upset|stunning|shocking|disaster|touchdown|three touchdowns/.test(t)
 let writer='gannon',tag='FOOTBALL DESK',subject=item.title,text=''
 if(labor){writer='pike';tag='FRONT OFFICE';subject=`The transaction is the headline. The incentive is the story.`;text=`${item.title}. ${item.summary||''} The front-office question is what management is optimizing for, what resource it is protecting, and what the move quietly admits about the value of the asset it controls.`}
 else if(injury){writer='crane';tag='FIELD NOTES';subject=`The injury report has created a human problem, not just a lineup problem`;text=`${item.title}. ${item.summary||''} The useful question is not to cosplay as a doctor. It is what this uncertainty changes — for the player, the people waiting on him, and the strange economy that forms around a body listed as questionable.`}
 else if(culture){writer='march';tag='SOCIETY DESK';subject=item.title;text=`${item.summary||item.title} The score is incidental. The interesting thing is the ritual around it: who gets to perform belonging, who is watching whom, and which behavior would look completely deranged to an outsider.`}
 else if(chaos){writer='kells';tag='CULTURE DESK';subject=`Football has produced another argument against planning`;text=`${item.title}. ${item.summary||''} Somewhere an August spreadsheet has just become a historical document. The sport remains extremely committed to making confident people look ridiculous in public.`}
 else if(qb){writer='sorrell';tag='COLUMN';subject=`The quarterback discourse machine has found fresh meat`;text=`${item.title}. ${item.summary||''} The football question will survive approximately six minutes before becoming a referendum on authority, competence and everybody's previous opinion. The backup quarterback does not enter a game anymore. He is appointed special counsel.`}
 else{const detail=(item.summary||'').trim();const footballSignal=/\b(target|targets|reception|receptions|catch|catches|yards|route|routes|snap|snaps|carry|carries|touch|touches|pressure|pressures|sack|sacks|blitz|completion|attempt|attempts|air yards|red zone|third down|personnel|alignment|slot|outside|motion|play action|yards per|percent|%|first down)\b/i.test(detail);if(detail.length<45||!footballSignal)return null;text=`${detail} The actionable part is the specific usage or efficiency signal in that result; that is what determines whether this changes our expectation going forward.`}
 const artifactCentered=/\b(post|tweet|video|quote|statement|letter|memo|podcast|interview|clip|social media)\b/i.test(t);return {writer,tag,subject,text,thread:'NFL WIRE',story_key:keyOf(item),source_url:artifactCentered?(item.url||null):null,source_name:artifactCentered?(item.source||null):null}
}
async function generateAndPublish(d:any,games:any[],prevGames:any[],now:Date){
 const {data:recent}=await d.from('brief_live_desk_posts').select('subject,text,writer,tag,published_at,story_key').eq('status','live').order('sort_time',{ascending:false}).limit(100)
 const memory=await recentMemory(d)
 const seen=new Set((recent||[]).map((p:any)=>p.story_key).filter(Boolean))
 const analytics=await maudeAnalytics()
 const leagueCandidates=leagueObservations(games)
 const packet=buildPacket({league:games,nfl:[...leagueCandidates,...analytics],memory,recent:recent||[],lore:['The Brief covers this fantasy league as a living social world. Running jokes and prior claims should only be used when the evidence earns the callback.']})
 const {data:openRun}=await d.from('brief_editorial_runs').select('id').in('status',['queued','pitched','selected','written']).limit(1).maybeSingle()
 if(!openRun){await d.from('brief_editorial_runs').insert({status:'queued',packet})}
 for(const post of rank([...leagueCandidates,...analytics],[...(recent||[]),...memory])){if(seen.has(post.story_key)||!publishable(post))continue;const {data:created,error}=await d.from('brief_live_desk_posts').insert({...post,status:'live',published_at:now.toISOString(),sort_time:now.toISOString()}).select('id').single();if(error)throw error;await remember(d,post,created?.id);console.log(JSON.stringify({event:'published-analytics',storyKey:post.story_key,subject:post.subject,writer:post.writer}));return true}
 const wire=await externalWire()
 const offset=Math.floor(now.getTime()/300000)%Math.max(1,wire.length),ordered=wire.length?[...wire.slice(offset),...wire.slice(0,offset)]:wire
 let rejected:any[]=[]
 for(const item of ordered){
  const storyKey=keyOf(item);if(seen.has(storyKey)){rejected.push({title:item.title,reason:'story-already-covered'});continue}
  const post=assignStory(item,games,recent||[]);if(!post){rejected.push({title:item.title,reason:'assignment'});continue}
  if(post.writer==='gannon'){rejected.push({title:item.title,reason:'maude-requires-analytics'});continue}
  if(!publishable(post)){rejected.push({title:item.title,reason:'quality-gate',writer:post.writer});continue}
  if(redundant(post,[...(recent||[]),...memory])){rejected.push({title:item.title,reason:'editorial-memory',writer:post.writer});continue}
  const recentWriter=(recent||[]).slice(0,6).filter((p:any)=>p.writer===post.writer).length;if(recentWriter>=3){rejected.push({title:item.title,reason:'writer-concentration',writer:post.writer});continue}
  const fingerprint=(post.subject+' '+post.text).toLowerCase(),a=new Set(fingerprint.split(/\W+/).filter((w:string)=>w.length>4))
  const dup=(recent||[]).slice(0,25).some((p:any)=>{const b=new Set(((p.subject||'')+' '+(p.text||'')).toLowerCase().split(/\W+/).filter((w:string)=>w.length>4));const overlap=[...a].filter(x=>b.has(x)).length;return overlap/Math.max(1,Math.min(a.size,b.size))>.72})
  if(dup){rejected.push({title:item.title,reason:'premise-overlap'});continue}
  const {error}=await d.from('brief_live_desk_posts').insert({...post,status:'live',published_at:now.toISOString(),sort_time:now.toISOString()});if(error)throw error
  console.log(JSON.stringify({event:'published',wire:wire.length,storyKey,subject:post.subject,writer:post.writer}));return true
 }
 console.log(JSON.stringify({event:'no-publish',wire:wire.length,rejected:rejected.slice(0,20)}));return false
}
async function publishCandidate(d:any,now:Date){
 const {data:c}=await d.from('brief_editorial_candidates').select('*').eq('status','ready').order('priority',{ascending:false}).order('created_at',{ascending:true}).limit(1).maybeSingle()
 if(!c)return false
 const {data:recent}=await d.from('brief_live_desk_posts').select('subject,writer,tag').eq('status','live').order('sort_time',{ascending:false}).limit(12)
 const words=(s:string)=>new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter((w:string)=>w.length>3))
 const a=words((c.subject||'')+' '+(c.text||''))
 const duplicate=(recent||[]).some((p:any)=>{const b=words((p.subject||'')+' '+(p.text||''));const overlap=[...a].filter(x=>b.has(x)).length;return p.subject===c.subject||overlap/Math.max(1,Math.min(a.size,b.size))>.62})
 const voiceRules:any={
  gannon:['usage','route','target','snap','projection','lineup','efficiency','leverage','yards','points','touch'],
  pike:['asset','market','price','capital','value','allocation','incentive','cost','return','resource'],
  crane:['evidence','exhibit','investigation','mystery','file','witness','scene','proof','record'],
  kells:['culture','group chat','internet','celebrity','absurd','meme','theater','character','vibe'],
  march:['room','social','ritual','status','manager','behavior','ceremony','etiquette','scene'],
  sorrell:['power','ego','institution','authority','hypocrisy','owner','system','testimony','verdict']
 }
 const combined=((c.subject||'')+' '+(c.text||'')).toLowerCase()
 const anchors=voiceRules[c.writer]||[]
 const voicePass=anchors.some((x:string)=>combined.includes(x))
 if(duplicate||!voicePass){await d.from('brief_editorial_candidates').update({status:'skipped'}).eq('id',c.id);return false}
 await d.from('brief_live_desk_posts').insert({writer:c.writer,tag:c.tag,subject:c.subject,text:c.text,thread:'WEEK 3',status:'live',published_at:now.toISOString(),sort_time:now.toISOString()})
 await d.from('brief_editorial_candidates').update({status:'published'}).eq('id',c.id)
 return true
}
Deno.serve(async req=>{
 const d=db(),url=new URL(req.url),action=url.searchParams.get('action')||'scores'
 if(req.method==='OPTIONS')return new Response('ok',{headers:{'Access-Control-Allow-Origin':'*'}})
 if(action==='scores'){
  const {data}=await d.from('brief_live_score_state').select('*').order('captured_at',{ascending:false}).limit(1).maybeSingle()
  if(!data)return json({ok:false,error:'No score snapshot'},503)
  return json({ok:true,source:data.source,week:data.week,updatedAt:data.captured_at,matchups:data.payload.matchups||[]})
 }
 if(action!=='tick')return json({error:'not found'},404)
 try{
  const api=`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE}?view=mMatchup&view=mMatchupScore&view=mTeam`
  const r=await fetch(api,{headers:{Accept:'application/json'}})
  if(!r.ok)throw new Error('ESPN '+r.status)
  const raw=await r.json(),period=Number(raw?.scoringPeriodId||raw?.status?.currentMatchupPeriod||3)
  const names=new Map((raw?.teams||[]).map((t:any)=>[Number(t.id),t.location&&t.nickname?`${t.location} ${t.nickname}`:t.name||t.abbrev]))
  const side=(x:any)=>{const id=Number(x?.teamId),live=x?.pointsByScoringPeriod?.[period];return{id,name:names.get(id)||`Team ${id}`,score:Number.isFinite(Number(live))?Number(live):Number(x?.totalPoints||0),projection:Number(x?.totalProjectedPoints||0)}}
  const games=(raw?.schedule||[]).filter((m:any)=>Number(m.matchupPeriodId)===period).map((m:any)=>({id:m.id,winner:m.winner||'UNDECIDED',home:side(m.home),away:side(m.away)}))
  if(!games.length)throw new Error('No matchups')
  const {data:prev}=await d.from('brief_live_score_state').select('*').order('captured_at',{ascending:false}).limit(1).maybeSingle()
  await d.from('brief_live_score_state').insert({source:'espn',week:period,payload:{matchups:games}})
  const now=new Date(),ny=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hour12:false}).format(now))
  if(ny>=13&&ny<24){
    const {data:last}=await d.from('brief_live_desk_posts').select('published_at').eq('status','live').order('published_at',{ascending:false}).limit(1).maybeSingle()
    const mins=last?.published_at?(Date.now()-new Date(last.published_at).getTime())/60000:99
    if(mins>=3){
      if(!(await publishCandidate(d,now))) await generateAndPublish(d,games,prev?.payload?.matchups||[],now)
    }
  }
  return json({ok:true,source:'espn',week:period,matchups:games})
 }catch(e){
  const error=String((e as Error).message||e)
  const {data:snaps}=await d.from('brief_live_score_state').select('*').order('captured_at',{ascending:false}).limit(2)
  const snap=snaps?.[0],previousSnap=snaps?.[1]
  if(snap?.payload?.matchups?.length){
    const now=new Date(),ny=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hour12:false}).format(now))
    const {data:last}=await d.from('brief_live_desk_posts').select('published_at').eq('status','live').order('published_at',{ascending:false}).limit(1).maybeSingle()
    const mins=last?.published_at?(Date.now()-new Date(last.published_at).getTime())/60000:99
    if(ny>=13&&ny<24&&mins>=3){
      if(!(await publishCandidate(d,now))) await generateAndPublish(d,snap.payload.matchups,previousSnap?.payload?.matchups||[],now)
    }
    return json({ok:true,source:'verified-snapshot',stale:true,error,matchups:snap.payload.matchups})
  }
  return json({ok:false,error},502)
 }
})