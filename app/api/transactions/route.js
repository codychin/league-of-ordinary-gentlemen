export const dynamic='force-dynamic'

const LEAGUE='310731'
const SEASON=2026
const BASE=`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE}`

const teamName=t=>t?.name||(t?.location&&t?.nickname?`${t.location} ${t.nickname}`:t?.abbrev)||`Team ${t?.id}`

export async function GET(){
  try{
    const leagueResponse=await fetch(`${BASE}?view=mStatus&view=mTeam`,{cache:'no-store',headers:{Accept:'application/json'}})
    if(!leagueResponse.ok)throw new Error(`ESPN league ${leagueResponse.status}`)
    const league=await leagueResponse.json()
    const scoringPeriodId=Number(league?.scoringPeriodId||league?.status?.currentMatchupPeriod||1)
    const teams=Object.fromEntries((league?.teams||[]).map(t=>[Number(t.id),teamName(t)]))

    const txResponse=await fetch(`${BASE}?view=mTransactions2&scoringPeriodId=${scoringPeriodId}`,{cache:'no-store',headers:{Accept:'application/json'}})
    if(!txResponse.ok)throw new Error(`ESPN transactions ${txResponse.status}`)
    const txData=await txResponse.json()
    const raw=(txData?.transactions||[])
      .filter(t=>['WAIVER','FREEAGENT','TRADE'].includes(String(t?.type||'').toUpperCase()))
      .sort((a,b)=>Number(b?.processDate||b?.proposedDate||0)-Number(a?.processDate||a?.proposedDate||0))

    const playerIds=[...new Set(raw.flatMap(t=>(t?.items||[]).map(i=>Number(i?.playerId)).filter(Number.isFinite)))]
    let players={}
    if(playerIds.length){
      const filter={players:{filterIds:{value:playerIds},limit:Math.max(50,playerIds.length)}}
      const p=await fetch(`${BASE}?view=kona_player_info`,{
        cache:'no-store',
        headers:{Accept:'application/json','X-Fantasy-Filter':JSON.stringify(filter)}
      })
      if(p.ok){
        const body=await p.json()
        players=Object.fromEntries((body?.players||[]).map(x=>[Number(x?.player?.id),x?.player?.fullName||x?.player?.name]).filter(([,name])=>name))
      }
    }

    const transactions=raw.map(t=>({
      id:t.id,
      status:String(t.status||'').toUpperCase(),
      type:String(t.type||'').toUpperCase(),
      teamId:Number(t.teamId),
      team:teams[Number(t.teamId)]||`Team ${t.teamId}`,
      bidAmount:Number(t.bidAmount||0),
      date:new Date(Number(t.processDate||t.proposedDate||Date.now())).toISOString(),
      items:(t.items||[]).map(i=>({
        type:String(i.type||'').toUpperCase(),
        playerId:Number(i.playerId),
        player:players[Number(i.playerId)]||`Player ${i.playerId}`
      }))
    }))

    return Response.json({ok:true,week:scoringPeriodId,transactions},{headers:{'Cache-Control':'no-store, max-age=0'}})
  }catch(error){
    return Response.json({ok:false,transactions:[],error:String(error?.message||error)},{status:503,headers:{'Cache-Control':'no-store, max-age=0'}})
  }
}
