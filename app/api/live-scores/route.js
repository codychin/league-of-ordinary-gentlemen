const LEAGUE_ID='310731'
const SEASON=2026
const FALLBACK=[
  {home:{id:9,name:'For the Love of the Kraft',score:5.6,projection:115.7},away:{id:5,name:"I'm a Skatt man",score:0,projection:144.4}},
  {home:{id:6,name:'Pollard Greens',score:31.9,projection:163.6},away:{id:3,name:'The All Ugly Team',score:21.6,projection:145.3}},
  {home:{id:1,name:'Kupp Kupp Doubs',score:0,projection:146.7},away:{id:4,name:'The Route 22 Clubhouse',score:0,projection:142.7}},
  {home:{id:11,name:'Lloyd of the Rings',score:-5.5,projection:124.7},away:{id:7,name:'Mr Hopkins Opus',score:0,projection:145.6}},
  {home:{id:8,name:"Shake 'N Baker",score:42.2,projection:156.8},away:{id:2,name:'DarkHorse Danir',score:0,projection:149.0}},
  {home:{id:10,name:'Royrek Tishmeshulam',score:7.5,projection:147.5},away:{id:12,name:'CeeDeep Shaheeded Rivalry',score:0,projection:149.8}}
]

export const dynamic='force-dynamic'

const side=(raw,names,period)=>{
  const id=Number(raw?.teamId)
  const live=raw?.pointsByScoringPeriod?.[period]
  return {
    id,
    name:names.get(id)||`Team ${id}`,
    score:Number.isFinite(Number(live))?Number(live):Number(raw?.totalPoints||0),
    projection:Number(raw?.totalProjectedPoints||0)
  }
}

export async function GET(){
  try{
    const url=`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}?view=mMatchup&view=mMatchupScore&view=mTeam`
    const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}})
    if(!response.ok)throw new Error(`ESPN ${response.status}`)
    const data=await response.json()
    const period=Number(data?.scoringPeriodId||data?.status?.currentMatchupPeriod||3)
    const names=new Map((data?.teams||[]).map(t=>[Number(t.id),t.location&&t.nickname?`${t.location} ${t.nickname}`:t.name||t.abbrev||`Team ${t.id}`]))
    const matchups=(data?.schedule||[]).filter(m=>Number(m.matchupPeriodId)===period).map(m=>({
      id:m.id,
      winner:m.winner||'UNDECIDED',
      home:side(m.home,names,period),
      away:side(m.away,names,period)
    }))
    if(!matchups.length)throw new Error('No current matchups')
    return Response.json({ok:true,source:'espn',week:period,updatedAt:new Date().toISOString(),matchups},{headers:{'Cache-Control':'no-store, max-age=0'}})
  }catch(error){
    return Response.json({ok:true,source:'fallback',week:3,updatedAt:new Date().toISOString(),matchups:FALLBACK,error:String(error?.message||error)},{headers:{'Cache-Control':'no-store, max-age=0'}})
  }
}
