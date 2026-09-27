export type Candidate={writer:string;tag:string;subject:string;text:string;thread:string;story_key:string;score?:number;premise_key?:string;evidence?:unknown}
const stop=new Set(['the','a','an','and','or','but','to','of','in','on','for','with','is','it','that','this','has','have','had','from','as','at','by'])
export const tokens=(s:string)=>new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>3&&!stop.has(w)))
export const similarity=(a:string,b:string)=>{const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;const n=[...A].filter(x=>B.has(x)).length;return n/Math.min(A.size,B.size)}
export const premiseKey=(c:Candidate)=>[c.writer,c.tag,c.subject.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()].join('|')
export function quality(c:Candidate){let n=0;if(c.subject?.length>12)n+=2;if(c.text?.length>120)n+=2;if(/\d/.test(c.text))n+=1;if(c.evidence)n+=2;if(c.thread==='NERD BALL')n+=2;return n}
export function redundant(c:Candidate,recent:any[]){const key=c.premise_key||premiseKey(c);return recent.some(p=>{if(p.premise_key&&p.premise_key===key)return true;if(p.writer===c.writer&&p.subject===c.subject)return true;return p.writer===c.writer&&similarity(c.subject+' '+c.text,(p.subject||'')+' '+(p.text||''))>.66})}
export function rank(candidates:Candidate[],recent:any[]){return candidates.map(c=>({...c,premise_key:c.premise_key||premiseKey(c),score:(c.score||0)+quality(c)})).filter(c=>quality(c)>=4&&!redundant(c,recent)).sort((a,b)=>(b.score||0)-(a.score||0))}
