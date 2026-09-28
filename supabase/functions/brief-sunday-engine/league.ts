import type {Candidate} from './editorial.ts'
export function leagueObservations(games:any[]):Candidate[]{
 const out:Candidate[]=[]
 for(const g of games||[]){const margin=Math.abs(Number(g.home.score)-Number(g.away.score)),leader=Number(g.home.score)>=Number(g.away.score)?g.home:g.away,trailer=leader===g.home?g.away:g.home
  if(margin<=12&&Number(g.home.score)>=80&&Number(g.away.score)>=80)out.push({writer:'march',tag:'ROOM REPORT',subject:g.home.name+'–'+g.away.name+' is the room to watch',text:leader.name+' leads '+Number(leader.score).toFixed(1)+'–'+Number(trailer.score).toFixed(1)+', a margin of '+margin.toFixed(1)+'. Both teams are already above 80, so this is not a matchup waiting to become relevant; it is a live contest with almost no separation. The social condition is simple: neither manager has permission to stop checking.',thread:'LEAGUE LIVE',story_key:'league:close:'+g.id+':'+Math.round(margin),score:18-margin/3,evidence:{margin,leader:leader.name}})
  const hp=Math.abs(Number(g.home.projection)-Number(g.home.score)),ap=Math.abs(Number(g.away.projection)-Number(g.away.score))
  if(hp<=5&&ap<=5&&margin<=20)out.push({writer:'pike',tag:'MARKET MOVE',subject:g.home.name+'–'+g.away.name+' has almost no projection left to hide behind',text:g.home.name+' sits at '+Number(g.home.score).toFixed(1)+' against a '+Number(g.home.projection).toFixed(1)+' projection; '+g.away.name+' is at '+Number(g.away.score).toFixed(1)+' against '+Number(g.away.projection).toFixed(1)+'. Both sides are within five points of their current expected finish. The market has mostly resolved; what remains is exposure, not optimism.',thread:'LEAGUE LIVE',story_key:'league:resolved:'+g.id+':'+Math.round(margin),score:13,evidence:{margin,homeProjectionGap:hp,awayProjectionGap:ap}})
 }
 return out
}
