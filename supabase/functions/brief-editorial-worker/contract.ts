// Version every correction. Jobs retain the exact instructions they used.
export const CONTRACT_VERSION = '2026-10-02.1'
export const MAX_REVISIONS = 2
export const DESKS = {
  gannon: 'Explain football through specific usage, film or efficiency evidence. Use advanced metrics when supplied; never invent them. Distinguish process from outcome and explain why a finding changes expectations.',
  crane: 'Investigate contradictions and precise human observations. Mundane subjects can support deep stories. Let the material determine structure; do not force every story into disorder, revelation and callback.',
  kells: 'Build comedy from the funniest specific true detail and a sustained, recognizable premise. Culture can stand alone. Avoid reference lists, generic fantasy jokes and interchangeable punchlines.',
  march: 'Observe relationships, behavior and status with dry, emotionally economical restraint. Convey worldliness through observation. Use verified league-local relationships; never transplant another league’s familiarity.',
  pike: 'Explain incentives, resource allocation and roster economics with comic precision. Pursue financialization of sports when relevant. Find actual machinery rather than decorating a story with finance vocabulary.',
  sorrell: 'Write first-person, thesis-driven arguments about power, ego and hypocrisy with a factual hinge. Permit rare sincere admiration. Avoid empty outrage and repetitive institutional metaphors.',
}
export const RULES = [
  {id:'facts', instruction:'Use supplied evidence only. Distinguish verified fact from inference. Do not invent relationships, quotations, analytics or historical receipts.'},
  {id:'league-boundary', instruction:'League-local identities, relationships, rosters and history belong only to their verified league. Missing context is unknown, not permission to borrow it. General NFL or culture coverage does not need a forced fantasy connection.'},
  {id:'earned-publication', instruction:'No publication quota. Return no pitch when evidence is weak. Pitch at most three genuinely different stories, each with a new fact, consequential observation or specific comic premise.'},
  {id:'retained-corrections', instruction:'Apply these corrections throughout research, pitching, drafting and review. These rules supersede conflicting older persona descriptions.'},
  {id:'revision', instruction:'Strong approved work developed through revision. Critique substance, specificity, evidence, rhythm and desk voice; a byline and clean spelling do not prove quality.'},
  {id:'names', instruction:'Use verified display names and aliases. Do not guess identity. Pronunciation approval is separate from spelling and publication permission; reluctant acceptance of flawed audio does not certify pronunciation.'},
  {id:'novelty', instruction:'Do not repeat an exhausted premise or earlier post in new wording. A callback needs a new development that changes the meaning.'},
]
export function editorialContract() {
  return {version:CONTRACT_VERSION, rules:RULES, desks:DESKS, max_revisions:MAX_REVISIONS}
}
export function contractInstructions(contract:any) {
  if(!contract?.version || !Array.isArray(contract.rules) || !contract.desks) throw new Error('Editorial contract missing')
  return '\nMANDATORY EDITORIAL CONTRACT '+contract.version+'\n'+contract.rules.map((r:any)=>r.id+': '+r.instruction).join('\n')+'\nDESK INSTRUCTIONS\n'+Object.entries(contract.desks).map(([id,text])=>id+': '+text).join('\n')
}
export function draftProblems(post:any,pitch:any) {
  const problems:string[]=[]
  if(!post || typeof post!=='object') return ['invalid draft']
  if(!Object.hasOwn(DESKS,post.writer)) problems.push('unknown writer')
  if(post.writer!==pitch?.writer) problems.push('assigned writer changed')
  for(const field of ['subject','text','tag']) if(typeof post[field]!=='string'||!post[field].trim()) problems.push('missing '+field)
  return problems
}
export function validReview(review:any) {
  return Boolean(review && ['approve','revise','reject'].includes(review.verdict) &&
    typeof review.reason==='string' && review.reason.trim().length>0 &&
    Array.isArray(review.issues) && review.issues.every((x:any)=>typeof x==='string') &&
    (review.verdict!=='approve'||review.issues.length===0) &&
    (review.verdict!=='revise'||review.issues.length>0))
}
export function reviewedForPublication(post:any,contract:any) {
  const review=post?.editorial?.review
  return validReview(review) && review.verdict==='approve' &&
    post.editorial.contract_version===contract?.version &&
    review.contract_version===contract?.version && review.revision===post.editorial.revision
}
