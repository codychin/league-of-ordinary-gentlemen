// Yahoo reports a leader before it declares a result. Explicit status is authoritative.
export function isMatchupFinal(game){
 if(game?.status) return String(game.status).toLowerCase()==='final';
 return ['HOME','AWAY','TIE'].includes(game?.winner);
}
