export const writers={
  wren:{slug:'beatrice-wren',name:'Beatrice Wren',title:'Culture & Civic Life',bio:'Covers celebrity behavior, minor municipal disorder and any public spectacle that becomes funnier when described as governance.',tendency:'Has never established a factual connection between Big Citrus and New York society, but considers the pattern significant.'},
  voss:{slug:'lenora-voss',name:'Lenora Voss',title:'Transactions & Labor',bio:'Treats waiver claims, trade proposals and short-term roster employment as matters of corporate governance.',tendency:'Believes Route 22 is always one phone call away from creating discoverable material.'},
  quill:{slug:'martin-quill',name:'Martin Quill',title:'Fantasy Operations',bio:'Reports scores, lineup decisions and bench production with the warmth of an external auditor.',tendency:'Has not forgiven Danir for the Purdy–Monangai bench incident and has declined to establish a timetable for doing so.'},
  crane:{slug:'hollis-crane',name:'Hollis Crane',title:'Investigations Editor',bio:'Specializes in screenshots, institutional denials and statements that answer questions nobody remembers asking.',tendency:'Considers Choe cooperative in the narrow sense that each answer reliably produces two additional questions.'},
  pryce:{slug:'felix-pryce',name:'Felix Pryce',title:'Columnist at Large',bio:'Writes about league psychology, selective memory and the emotional consequences of one good fantasy week.',tendency:'Regards Kash confidence as a renewable public nuisance and advanced analytics as something teams discover immediately after losing.'},
}

export const articleWriters={
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
