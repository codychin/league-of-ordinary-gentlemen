// Established Week 8 card aliases, keyed by edition and stable team ID.
// Full matchup names belong in accessible labels and viewer metadata.
const aliases={
  "doge": {
    "1": "CALEB",
    "3": "BEARS",
    "2": "GIMOTHY",
    "10": "HASSAN",
    "4": "EL NIÑO",
    "5": "JERRUH",
    "6": "KONG",
    "7": "TRANIMAL",
    "8": "OCELLUS",
    "11": "ORDWAY",
    "9": "TIGHT ENDS",
    "12": "NIX"
  },
  "loog": {
    "1": "ROY",
    "3": "UGLY",
    "2": "DANIR",
    "10": "TISH",
    "4": "R22",
    "11": "LLOYD",
    "5": "SKATT",
    "12": "CEE",
    "6": "POLLARD",
    "9": "KRAFT",
    "7": "HOPKINS",
    "8": "SHAKE"
  },
  "sunday-crew": {
    "1": "ZAY",
    "4": "CROATIA",
    "11": "COOKIES",
    "12": "RBS",
    "2": "STROKE",
    "5": "DITKA",
    "3": "RHAMONDRE",
    "9": "SCRUMP",
    "6": "ALLENTOWN",
    "7": "J BIRD",
    "8": "WAKE",
    "10": "CHANE"
  }
};

export function previewCardLabel(edition,teamIds){
 if(!Array.isArray(teamIds)||teamIds.length!==2)throw Error("Exact preview team pair required");
 return teamIds.map(id=>{const label=aliases[edition]?.[String(id)];if(!label)throw Error("Unknown preview card team: "+edition+"/"+id);return label;}).join(" · ");
}
