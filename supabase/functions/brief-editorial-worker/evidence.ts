export async function nflEvidence(){
 const r=await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',{headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(12000)})
 if(!r.ok)throw new Error('NFL reporting unavailable: '+r.status)
 const board=await r.json(),today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}),events=(board.events||[]).filter((e:any)=>new Date(e.date).toLocaleDateString('en-CA',{timeZone:'America/New_York'})===today)
 const result=events.map((e:any)=>({id:e.id,name:e.name,date:e.date,status:e.status,competitions:e.competitions,links:e.links}))
 // Include actual box scores for analytical posts, not invented advanced metrics.
 const active=events.filter((e:any)=>['in','post'].includes(e.status?.type?.state)).slice(0,12)
 const summaries=await Promise.allSettled(active.map(async(e:any)=>{
  const response=await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event='+e.id,{headers:{Accept:'application/json','User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(10000)})
  if(!response.ok)throw new Error('NFL summary '+e.id+': '+response.status)
  const s=await response.json()
  return {event:e.id,boxscore:s.boxscore,scoringPlays:s.scoringPlays,news:s.news,source:'ESPN',source_url:'https://www.espn.com/nfl/game/_/gameId/'+e.id}
 }))
 const details=summaries.flatMap(x=>x.status==='fulfilled'&&x.value?[x.value]:[])
 if(active.length&&!details.length)throw new Error('All live game summaries failed; refusing an empty evidence packet')
 return {as_of:new Date().toISOString(),scoreboard:result,details}
}
