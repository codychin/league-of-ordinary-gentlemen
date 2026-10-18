// Supplemental morning coverage. Scoring events retain first priority.
export function morningCandidates(nfl, now = new Date()) {
 const day = date => new Date(date).toLocaleDateString('en-CA',{timeZone:'America/New_York'});
 const today = day(now);
 const highImpact = /\b(injur\w*|inactiv\w*|activ\w*|out|questionable|doubtful|ruled out|suspend\w*|arrest\w*|trad\w*|roster|released|waiver\w*|signs|signed|dies|died|death|concussion|out for|will play)\b/i;
 // ESPN-only morning briefs lack corroboration metadata. Exclude medical claims before model calls.
 // Contextual break/tear matching retains ordinary idioms such as broken records and tears of joy.
 const anatomy = '(?:bones?|hands?|wrists?|fingers?|thumbs?|arms?|elbows?|shoulders?|collarbones?|clavicles?|ribs?|legs?|ankles?|feet|foot|toes?|knees?|hips?|necks?|backs?|tendons?|ligaments?|muscles?|hamstrings?|achilles|acl|mcl|pcl|lcl|meniscus|pectoral|biceps|triceps)';
 const medicalClaim = new RegExp('\\b(?:fractur\\w*|sprain\\w*|strain(?:s|ed)?|concuss\\w*|dislocat\\w*|ruptur\\w*|surgery|surgeries|surgical|hospitali[sz]\\w*|carted off|medical evaluation|pain|soreness|swelling|bruis\\w*)\\b|\\b(?:broken|broke|breaks?|torn|tear|tears|tore|tearing)\\b[^.!?]{0,60}\\b' + anatomy + '\\b|\\b' + anatomy + '\\b[^.!?]{0,40}\\b(?:broken|fractured|torn|tear|tears|ruptured)\\b', 'i');
 const evergreen = /\b(rankings|betting|odds|prop plays|draft questions|highlights)\b/i;
 const articles = (nfl.morningNews || []).filter(a => {
  const timestamp = Date.parse(a.published);
  const text = (a.headline || '') + ' ' + (a.description || '');
  return Number.isFinite(timestamp) && timestamp <= now.getTime() && day(timestamp) === today &&
   a.source_url?.startsWith('https://www.espn.com/') && !highImpact.test(text) && !medicalClaim.test(text) && !evergreen.test(text);
 }).map(a => ({
  event_key:'news:' + a.id, as_of:nfl.as_of, kind:'reported-news',
  source_url:a.source_url, source_name:'ESPN',
  reporting:{headline:a.headline,description:a.description,published:a.published},
  guidance:'Attribute reported facts to ESPN. Publication date alone does not prove event date. Avoid unsupported event dates, quotes, injury/roster claims, or added history. Commentary must follow the supplied facts.'
 }));
 const previews = (nfl.scoreboard || []).filter(g => day(g.date) === today &&
  g.status?.type?.state === 'pre' && Date.parse(g.date) > now.getTime()
 ).map(g => ({
  event_key:g.id + ':pregame', as_of:nfl.as_of, kind:'pregame',
  source_url:'https://www.espn.com/nfl/game/_/gameId/' + g.id,source_name:'ESPN',
  game:{id:g.id,name:g.name,date:g.date,status:g.status,competitions:(g.competitions || []).map(c => ({
   venue:c.venue?.fullName,neutralSite:c.neutralSite,
   competitors:(c.competitors || []).map(t=>({team:t.team?.displayName,homeAway:t.homeAway,records:t.records}))
  }))},
  guidance:'Pregame only. Use scheduled kickoff and supplied records. No invented injuries, starting lineups, predictions presented as facts, or game action.'
 }));
 return [...articles,...previews];
}
