import type {Candidate} from './editorial.ts'
export function leagueObservations(nowGames:any[],prevGames:any[]):Candidate[]{
 const prev=new Map((prevGames||[]).map((g:any)=>[String(g.id),g])),out:Candidate[]=[]
 for(const g of nowGames||[]){const p:any=prev.get(String(g.id));if(!p)continue
  const sides:[any,any,any,any][]=[[g.home,g.away,p.home,p.away],[g.away,g.home,p.away,p.home]]
  for(const [team,opp,oldTeam,oldOpp] of sides){const gain=Number(team.score)-Number(oldTeam.score),oppGain=Number(opp.score)-Number(oldOpp.score),proj=Number(team.projection)-Number(oldTeam.projection)
   if(gain>=30){out.push({writer:'gannon',tag:'LEAGUE ANALYTICS',subject:team.name+' just changed the geometry of this matchup',text:team.name+' has added '+gain.toFixed(1)+' points since the previous verified snapshot, while '+opp.name+' added '+oppGain.toFixed(1)+'. The useful number is the relative swing: '+(gain-oppGain).toFixed(1)+' points of separation appeared in one update window. That is a real matchup event, not scoreboard wallpaper.',thread:'LEAGUE LIVE',story_key:'league:swing:'+g.id+':'+team.id+':'+Math.round(Number(team.score)/10),score:14+Math.abs(gain-oppGain)/5,evidence:{gain,oppGain,projectionDelta:proj}})}
   if(Math.abs(proj)>=12){out.push({writer:'pike',tag:'MARKET MOVE',subject:team.name+"'s expected finish just repriced",text:team.name+"'s projection moved "+(proj>0?'+':'')+proj.toFixed(1)+' points between verified snapshots, from '+Number(oldTeam.projection).toFixed(1)+' to '+Number(team.projection).toFixed(1)+'. That is the fantasy equivalent of a repricing event: the roster did not become more talented in an hour, but the information around its remaining assets changed materially.',thread:'LEAGUE LIVE',story_key:'league:projection:'+g.id+':'+team.id+':'+Math.round(Number(team.projection)/5),score:10+Math.abs(proj)/4,evidence:{projectionDelta:proj}})}
  }
  const oldMargin=Number(p.home.score)-Number(p.away.score),newMargin=Number(g.home.score)-Number(g.away.score)
  if(oldMargin*newMargin<0){const leader=newMargin>0?g.home:g.away,oldLeader=oldMargin>0?p.home:p.away;out.push({writer:'march',tag:'ROOM REPORT',subject:g.home.name+'–'+g.away.name+' has changed hands',text:oldLeader.name+' led at the previous verified snapshot. '+leader.name+' leads now, '+Math.abs(newMargin).toFixed(1)+' points clear. The interesting part is not merely the lead change; it is the social transition from watching a comfortable projection to negotiating an actual live sweat.',thread:'LEAGUE LIVE',story_key:'league:leadchange:'+g.id+':'+leader.id+':'+Math.round(Math.abs(newMargin)),score:18+Math.abs(newMargin)/5,evidence:{oldMargin,newMargin}})}
 }
 return out
}
