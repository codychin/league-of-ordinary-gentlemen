export function deskAssignment(recent:any[]){
 const desks=['gannon','crane','kells','march','pike','sorrell']
 const latest=recent.slice(0,6)
 const counts=Object.fromEntries(desks.map(d=>[d,latest.filter(p=>p.writer===d).length]))
 const cooling=latest.length>=2&&latest[0].writer===latest[1].writer?[latest[0].writer]:[]
 return {recent_byline_counts:counts,cooling_desks:cooling,priority_desks:desks.filter(d=>!cooling.includes(d)).sort((a,b)=>counts[a]-counts[b]),instruction:'Commission distinct premises for underrepresented desks first. Do not relabel a Gannon analysis with another byline. A cooling desk should sit out this assignment round. Return no pitch if no other desk has an earned story.'}
}
