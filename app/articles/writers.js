export const writers={
  wren:{
    slug:'beatrice-wren',name:'Beatrice Wren',title:'Culture & Civic Life',
    bio:'A former foreign correspondent reassigned after filing 4,000 words on a hotel breakfast buffet. She now covers celebrity behavior, minor municipal disorder and public spectacles with the grave composure normally reserved for disputed border crossings.',
    method:'Reports from the scene whenever possible, even when the scene is a frozen-yogurt line. Her dispatches frequently identify “local stakeholders” who are visibly just waiting for dessert.',
    voice:'Unflappable, globally informed and incapable of admitting that a story may not matter.',
    tendency:'Has never established a factual connection between Big Citrus and New York society, but considers the pattern significant.',
  },
  voss:{
    slug:'lenora-voss',name:'Lenora Voss',title:'Transactions & Labor',
    bio:'A former drive-time host who left broadcasting after management asked her to stop describing routine personnel changes as betrayals of the working class. She regards every waiver claim as a test of institutional character.',
    method:'Opens with a reasonable question, becomes personally offended by the answer and concludes with a monologue about incentives.',
    voice:'Combative, suspicious of consensus and unusually fluent in the emotional rights of recently dropped running backs.',
    tendency:'Believes Route 22 is always one phone call away from creating discoverable material.',
  },
  quill:{
    slug:'martin-quill',name:'Martin Quill',title:'Fantasy Operations',
    bio:'A film-room obsessive with an economics degree and the permanent expression of someone being shown a four-man rush incorrectly identified as a blitz. He would prefer the numbers speak for themselves but does not trust them to do it properly.',
    method:'Explains the football, checks the math and then isolates the exact managerial decision that made both irrelevant.',
    voice:'Dry, technically precise and openly exhausted by arguments that begin with “you had to watch the game.”',
    tendency:'Has not forgiven Danir for the Purdy–Monangai bench incident and has declined to establish a timetable for doing so.',
  },
  crane:{
    slug:'hollis-crane',name:'Hollis Crane',title:'Investigations Editor',
    bio:'Arrived at The Brief carrying a milk crate of unlabeled cables, three banker boxes and a theory about why the league changed its waiver settings in 2019. Nobody remembers hiring him. His access badge works.',
    method:'Connects screenshots, timestamps and unrelated old messages on a physical corkboard. The resulting theory is usually absurd and occasionally difficult to dismiss.',
    voice:'Breathless certainty forced through the vocabulary of sober investigative journalism.',
    tendency:'Considers Choe cooperative in the narrow sense that each answer reliably produces two additional questions.',
  },
  pryce:{
    slug:'felix-pryce',name:'Felix Pryce',title:'Columnist at Large',
    bio:'A former late-night monologue writer who insists he left television voluntarily and will explain why for forty minutes. He covers league psychology, selective memory and the emotional consequences of one good fantasy week.',
    method:'Lets a subject explain himself at length, waits for the contradiction and then repeats both statements next to each other.',
    voice:'Wry, conversational and just sympathetic enough to encourage further self-incrimination.',
    tendency:'Regards Kash confidence as a renewable public nuisance and advanced analytics as something teams discover immediately after losing.',
  },
  pike:{
    slug:'dashiell-pike',name:'Dashiell Pike',title:'Special Projects',
    bio:'An investigative podcaster whose assignments begin as jokes, acquire seventeen documents and end with a league member asking whether the episode really needed two parts.',
    method:'Asks a question that sounds ridiculous, follows the money until it becomes slightly less ridiculous and brings printed exhibits to social events.',
    voice:'Curious, overprepared and visibly delighted when an administrative detail becomes sinister.',
    tendency:'Suspects at least one inactive fantasy roster is functioning primarily as a shell company.',
  },
}

export const articleWriters={
  'danir-emergency-jobs-program':'voss',
  'nigella-shake-n-baker':'wren',
  'sydney-sweeney-consensus':'wren',
  'upper-east-side-froyo':'wren',
  'route-22-phones':'voss',
  'league-unbearable-tnf':'quill',
  'danir-bench-crime':'quill',
  'stone-unc-denial':'crane',
  'group-chat-investigation':'crane',
  'hopkins-opus-statement':'pryce',
  'all-ugly-process':'pryce',
  'sources-familiar':'pryce',
}

export const writerFor=slug=>writers[articleWriters[slug]]||writers.crane
