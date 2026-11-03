// Surface completed historical weeks from the existing mirrored team histories.
// An incomplete or inconsistent week is omitted rather than inventing a score.
export function loogArchivedScores(snapshot) {
  const teams=Object.values(snapshot?.teams||{}), through=Number(snapshot?.week);
  if (!Number.isInteger(through) || through<5 || teams.length!==12) return [];
  const weeks=[];
  for(let week=through-1;week>=4;week--){
    const games=[];let valid=true;
    for(const team of teams){
      const rows=team.season?.weekly?.filter(w=>w.week===week)||[];
      if(rows.length!==1){valid=false;break;}
      const row=rows[0],opponent=snapshot.teams[row.opponentSlug];
      const mirror=opponent?.season?.weekly?.filter(w=>w.week===week)||[];
      if(row.status!=='FINAL' || !opponent || mirror.length!==1 || mirror[0].status!=='FINAL' ||
         typeof row.score!=='number'||!Number.isFinite(row.score)||typeof row.opponentScore!=='number'||!Number.isFinite(row.opponentScore)||
         mirror[0].opponentSlug!==Object.keys(snapshot.teams).find(k=>snapshot.teams[k].teamId===team.teamId) ||
         row.score!==mirror[0].opponentScore || row.opponentScore!==mirror[0].score){valid=false;break;}
      if(team.teamId<opponent.teamId) games.push({team:team.teamName,score:row.score,opponent:opponent.teamName,opponentScore:row.opponentScore});
    }
    if(valid && games.length===6) weeks.push({week,games});
  }
  return weeks;
}
