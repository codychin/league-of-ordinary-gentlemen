export function latestWatchWeek(matchups) {
 const latest=[...matchups].filter(v=>Number.isInteger(v.season)&&Number.isInteger(v.week)).sort((a,b)=>b.season-a.season||b.week-a.week)[0];
 return {season:latest?String(latest.season):'',week:latest?String(latest.week):''};
}
